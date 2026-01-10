---
apply: manually
---

# ImmoLux Authentication Flow Documentation

This document describes the complete authentication system implementation in the ImmoLux backend, intended to guide frontend implementation.

## Overview

The ImmoLux authentication system uses:
- **JWT tokens** (JSON Web Tokens) with HS256 signing
- **HTTP-only cookies** for secure token storage
- **Session management** in PostgreSQL database for token revocation
- **Remember Me** functionality for extended sessions
- **Failed login tracking** with automatic account locking

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│   Client    │─────▶│  HTTP Route  │─────▶│  Handler    │─────▶│  Repository  │
│  (Browser)  │◀─────│  (Fiber v3)  │◀─────│  (Auth.go)  │◀─────│  (Database)  │
└─────────────┘      └──────────────┘      └─────────────┘      └──────────────┘
      │                     │
      │                     ▼
      │              ┌──────────────┐
      │              │  RouteContext│
      │              │  (context.go)│
      │              └──────────────┘
      │                     │
      │                     ▼
      │              ┌──────────────┐
      │              │ JWT Utils    │
      │              │ (jwt.go)     │
      │              └──────────────┘
      │
      ▼
  HTTP-only Cookie
  (session_token)
```

## API Endpoints

### Base URL
All endpoints are prefixed with `/api` (configured in `internal/server/server.go:21`)

### 1. Login (Public)
**Endpoint**: `POST /api/login`
**File**: `internal/server/routes/auth.go:15-97`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "userpassword",
  "rememberMe": false
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "role": "user"
    }
  },
  "error": null
}
```

**Response Headers**:
- `Set-Cookie: session_token=<JWT>; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=<expiration>`

**Error Responses**:

| Status | Error Code | Message | Reason |
|--------|------------|---------|---------|
| 400 | BAD_REQUEST | Invalid request body | Malformed JSON or missing required fields |
| 401 | INVALID_CREDENTIALS | Invalid email or password | Wrong email or password |
| 403 | ACCOUNT_LOCKED | Account locked due to too many failed login attempts | 5+ failed attempts |
| 500 | INTERNAL_ERROR | Failed to authenticate user | Database or server error |

**Cookie Details**:
- **Name**: `session_token` (constant in `internal/config/constants.go:11`)
- **HttpOnly**: `true` (prevents JavaScript access)
- **Secure**: Configured in `configs/config.toml` (`cookie_secure`)
- **SameSite**: `Strict` (CSRF protection)
- **Max-Age**:
  - `3600` seconds (1 hour) if `rememberMe = false`
  - `2592000` seconds (30 days) if `rememberMe = true`

**Implementation Notes**:
- Password is verified using bcrypt (`internal/database/user_repository.go:66`)
- Failed login attempts are tracked (`internal/database/user_repository.go:88-104`)
- Account locks after 5 failed attempts
- Session is created in database with hashed token (`internal/database/session_repository.go:28-50`)
- JWT contains: `userId`, `sessionId`, `rememberMe` claims

### 2. Is Connected (Public)
**Endpoint**: `GET /api/isconnected`
**File**: `internal/server/routes/auth.go:99-115`

**Request**: No body required, authentication is checked via cookie

**Success Response - Authenticated** (200 OK):
```json
{
  "success": true,
  "data": {
    "isConnected": true,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "role": "user"
    }
  },
  "error": null
}
```

**Success Response - Not Authenticated** (200 OK):
```json
{
  "success": true,
  "data": {
    "isConnected": false
  },
  "error": null
}
```

**Implementation Notes**:
- This endpoint does NOT return 401 errors
- Always returns 200 OK with `isConnected` boolean
- If authenticated, includes full user data
- Used for checking authentication status on page load

### 3. Logout (Secured)
**Endpoint**: `POST /api/logout`
**File**: `internal/server/routes/auth.go:117-146`

**Request**: No body required, uses session cookie for authentication

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Successfully logged out"
  },
  "error": null
}
```

**Response Headers**:
- `Set-Cookie: session_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` (clears cookie)

**Error Responses**:

| Status | Error Code | Message | Reason |
|--------|------------|---------|---------|
| 401 | COOKIE_MISSING | Session cookie not found | No session_token cookie |
| 401 | JWT_EXPIRED | Session token has expired | JWT token expired |
| 401 | JWT_INVALID | Session token is invalid | Invalid JWT signature |
| 401 | SESSION_NOT_FOUND | Session not found | Session ID from JWT not in database |
| 401 | SESSION_INVALID | Session is expired or has been invalidated | Session was revoked or expired |
| 500 | INTERNAL_ERROR | Failed to logout | Database error during invalidation |

**Implementation Notes**:
- This is a **secured route** (requires authentication)
- Session is invalidated in database with reason "USER_LOGOUT" (`internal/database/session_repository.go:77-92`)
- Cookie is cleared using `ClearCookie()` method
- Subsequent requests with same JWT will fail authentication

## Authentication Flow Details

### Login Flow

1. **Request Validation** (`auth.go:24-29`)
   - Parse JSON body into `LoginRequest` struct
   - Validate required fields: `email`, `password`

2. **User Authentication** (`auth.go:33-50`)
   - Query user by email (`user_repository.go:39-59`)
   - If user not found: return "Invalid email or password"
   - If user is locked (`failedLoginAttempts >= 5`): return "Account locked"
   - Verify password using bcrypt (`user_repository.go:66`)
   - If password invalid: increment failed attempts, return error

3. **Session Creation** (`auth.go:52-82`)
   - Generate JWT token with claims:
     - `userId`: User's database ID
     - `sessionId`: New session ID
     - `rememberMe`: Boolean from request
     - `iat`: Issued at timestamp
     - `exp`: Expiration timestamp (1 hour or 30 days)
     - `iss`: Issuer from config
   - Hash JWT token with SHA256 (`session.go:9-12`)
   - Calculate expiration time (`session.go:14-21`)
   - Create session in database with:
     - User ID
     - Token hash (not plain JWT)
     - Remember me flag
     - Expiration timestamp
     - IP address (from request)
     - User agent (from request)

4. **Response** (`auth.go:84-97`)
   - Reset failed login attempts to 0
   - Create HTTP-only cookie with JWT
   - Return user data (without password hash)
   - Set cookie in response headers

### Authentication Check Flow

This flow happens automatically for secured routes and in `IsConnected` endpoint.

1. **Cookie Extraction** (`context.go:116-122`)
   - Extract `session_token` cookie from request
   - If missing: return `COOKIE_MISSING` error

2. **JWT Validation** (`context.go:124-145`)
   - Parse JWT token (`jwt.go:26-44`)
   - Verify signature using secret from config
   - Check expiration timestamp
   - Extract claims: `userId`, `sessionId`, `rememberMe`
   - If expired: return `JWT_EXPIRED` error
   - If invalid signature: return `JWT_INVALID` error

3. **Session Validation** (`context.go:147-171`)
   - Query session from database by `sessionId` (`session_repository.go:52-75`)
   - Check if session exists
   - If not found: return `SESSION_NOT_FOUND` error
   - Check if session is active (`is_active = true`)
   - Check if session is not expired (`expires_at > NOW()`)
   - If invalid: return `SESSION_INVALID` error

4. **Context Creation** (`context.go:173-178`)
   - Create `UserContext` with `userId` and `sessionId`
   - Store in `RouteContext` for handler access
   - No `authError` if successful

5. **Route Authorization** (`server.go:125-131`)
   - For secured routes, check `IsAuthenticated()`
   - If not authenticated, return specific error from `GetAuthError()`
   - If authenticated, proceed to handler

### Logout Flow

1. **Authentication Check** (`server.go:125-131`)
   - Secured route automatically validates session
   - If invalid, returns appropriate 401 error

2. **Session Invalidation** (`auth.go:125-133`)
   - Get session ID from context
   - Begin database transaction
   - Update session in database:
     - Set `is_active = false`
     - Set `invalidated_at = NOW()`
     - Set `invalidation_reason = "USER_LOGOUT"`

3. **Cookie Clearing** (`auth.go:135-136`)
   - Call `ClearCookie()` with cookie name
   - Sets `Max-Age=0` to delete cookie

4. **Response** (`auth.go:138-142`)
   - Return success message
   - Cookie is removed from browser

## Security Features

### 1. HTTP-Only Cookies
**File**: `internal/server/routes/auth.go:148-159`

- Cookies are marked `HttpOnly`, preventing JavaScript access
- Protects against XSS (Cross-Site Scripting) attacks
- Token cannot be stolen via malicious scripts

### 2. CSRF Protection
**File**: `internal/server/routes/auth.go:156`

- Cookies use `SameSite=Strict`
- Browser only sends cookie for same-site requests
- Prevents Cross-Site Request Forgery attacks

### 3. Secure Flag
**File**: `configs/config.toml.template:23`

- Configurable via `cookie_secure` in config
- Should be `true` in production with HTTPS
- Ensures cookie only sent over encrypted connections

### 4. Password Security
**File**: `internal/database/user_repository.go:66`

- Passwords stored as bcrypt hashes
- Uses `golang.org/x/crypto/bcrypt`
- Hashes are never sent to client

### 5. Failed Login Protection
**File**: `internal/database/user_repository.go:88-104`

- Tracks failed login attempts per user
- Automatically locks account after 5 failures
- Prevents brute force attacks
- Reset to 0 on successful login

### 6. Session Revocation
**Files**:
- `internal/database/session_repository.go:77-92`
- `internal/database/ent/schema/session.go:1-47`

- Sessions stored in database, not just JWT
- Can be invalidated server-side
- Logout immediately invalidates session
- Expired sessions automatically fail validation

### 7. Token Hashing
**File**: `internal/utils/session.go:9-12`

- JWT tokens are hashed (SHA256) before database storage
- Plain JWT never stored in database
- If database compromised, tokens cannot be used

### 8. Specific Error Messages
**File**: `internal/server/routes/context.go:115-179`

- Different error codes for different failure reasons
- Helps frontend provide better UX
- Error codes:
  - `COOKIE_MISSING`: No session cookie
  - `JWT_EXPIRED`: Token expired
  - `JWT_INVALID`: Invalid signature
  - `SESSION_NOT_FOUND`: Session deleted
  - `SESSION_INVALID`: Session revoked/expired

## Database Schema

### Users Table
**File**: `internal/database/ent/schema/user.go`

Relevant fields for authentication:
```go
field.String("email").Unique()
field.String("password_hash")  // bcrypt hash
field.Int("failed_login_attempts").Default(0)
field.Time("last_login_attempt").Optional().Nillable()
```

### Sessions Table
**File**: `internal/database/ent/schema/session.go`

```go
field.String("session_token")      // SHA256 hash of JWT
field.Bool("is_active").Default(true)
field.Bool("remember_me").Default(false)
field.Time("expires_at")
field.String("ip_address").Optional().Nillable()
field.String("user_agent").Optional().Nillable()
field.Time("invalidated_at").Optional().Nillable()
field.String("invalidation_reason").Optional().Nillable()

// Foreign key
edge.From("user", User.Type).Ref("sessions").Unique().Required()
```

## Configuration

### Config File
**File**: `configs/config.toml.template:20-23`

```toml
[security]
jwt_secret = "your-super-secret-jwt-key-change-in-production-min-32-chars"
jwt_issuer = "immolux"
cookie_secure = false  # Set to true in production with HTTPS
```

### Constants
**File**: `internal/config/constants.go:11`

```go
const SessionCookieName = "session_token"
```

## Key Files Reference

### Configuration
- `configs/config.toml.template` - Configuration template with security settings
- `internal/config/config.go:22-37` - SecurityConfig struct and methods
- `internal/config/constants.go:11` - SessionCookieName constant

### Database
- `internal/database/ent/schema/user.go` - User entity schema
- `internal/database/ent/schema/session.go` - Session entity schema
- `internal/database/user_repository.go:39-104` - User authentication operations
- `internal/database/session_repository.go:28-92` - Session CRUD operations

### Authentication Logic
- `internal/server/routes/auth.go:15-146` - Login, IsConnected, Logout handlers
- `internal/server/routes/context.go:16-179` - RouteContext and authentication extraction
- `internal/utils/jwt.go:12-44` - JWT generation and validation
- `internal/utils/session.go:9-21` - Token hashing and expiration calculation

### Server
- `internal/server/server.go:75-139` - Route handlers with public/secured distinction
- `internal/server/routing.go:9-18` - Route registration

### Models
- `internal/models/auth.go` - DTOs for authentication (LoginRequest, UserDTO, etc.)
- `internal/models/server_api.go` - API response structure

### Error Handling
- `internal/server_error/server_error.go:54-57` - ServerError with Contains method

## Frontend Implementation Guide

### 1. Login Implementation

```typescript
// Login function
async function login(email: string, password: string, rememberMe: boolean) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Important: allows cookies
    body: JSON.stringify({ email, password, rememberMe }),
  });

  const data = await response.json();

  if (!data.success) {
    // Handle errors
    switch (data.error.code) {
      case 'INVALID_CREDENTIALS':
        throw new Error('Invalid email or password');
      case 'ACCOUNT_LOCKED':
        throw new Error('Account locked. Too many failed attempts.');
      default:
        throw new Error(data.error.message);
    }
  }

  // Success - cookie is automatically stored by browser
  return data.data.user;
}
```

### 2. Check Authentication Status

```typescript
// Check if user is authenticated (on app load)
async function checkAuth() {
  const response = await fetch('/api/isconnected', {
    method: 'GET',
    credentials: 'include', // Important: sends cookie
  });

  const data = await response.json();

  if (data.success && data.data.isConnected) {
    return data.data.user; // User is authenticated
  }

  return null; // User is not authenticated
}
```

### 3. Logout Implementation

```typescript
// Logout function
async function logout() {
  const response = await fetch('/api/logout', {
    method: 'POST',
    credentials: 'include', // Important: sends cookie
  });

  const data = await response.json();

  if (!data.success) {
    // Handle errors
    switch (data.error.code) {
      case 'COOKIE_MISSING':
      case 'JWT_EXPIRED':
      case 'SESSION_INVALID':
        // User already logged out, just clear local state
        break;
      default:
        throw new Error(data.error.message);
    }
  }

  // Cookie is automatically cleared by browser
  return data.data;
}
```

### 4. Handle 401 Errors

```typescript
// API request wrapper with auth handling
async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Always include cookies
  });

  if (response.status === 401) {
    const data = await response.json();

    // Handle different authentication errors
    switch (data.error.code) {
      case 'COOKIE_MISSING':
        // User never logged in
        redirectToLogin('Please log in to continue');
        break;
      case 'JWT_EXPIRED':
        // Session expired
        redirectToLogin('Your session has expired. Please log in again.');
        break;
      case 'JWT_INVALID':
        // Invalid token
        redirectToLogin('Invalid session. Please log in again.');
        break;
      case 'SESSION_INVALID':
        // Session was revoked
        redirectToLogin('Your session is no longer valid. Please log in again.');
        break;
      case 'SESSION_NOT_FOUND':
        // Session deleted from database
        redirectToLogin('Session not found. Please log in again.');
        break;
    }

    throw new Error(data.error.message);
  }

  return response;
}
```

### 5. Protected Routes

```typescript
// React example with React Router
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth()
      .then((user) => {
        if (user) {
          setUser(user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
```

### Important Frontend Notes

1. **Always use `credentials: 'include'`** in fetch requests to send/receive cookies
2. **Never try to access the JWT token** - it's HTTP-only and inaccessible to JavaScript
3. **Handle 401 errors globally** - redirect to login page
4. **Check authentication on app load** - use `/api/isconnected` endpoint
5. **Remember Me checkbox** - affects session duration (1 hour vs 30 days)
6. **Error codes are specific** - provide user-friendly messages based on error code
7. **Logout is instant** - server invalidates session immediately

## Testing Authentication

### Manual Testing with cURL

```bash
# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password","rememberMe":false}' \
  -c cookies.txt

# Check authentication
curl -X GET http://localhost:3000/api/isconnected \
  -b cookies.txt

# Logout
curl -X POST http://localhost:3000/api/logout \
  -b cookies.txt \
  -c cookies.txt
```

### Testing Remember Me

```bash
# Short session (1 hour)
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password","rememberMe":false}' \
  -v

# Long session (30 days)
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password","rememberMe":true}' \
  -v
```

Check the `Set-Cookie` header for `Max-Age` value.

## Troubleshooting

### Cookie Not Being Set

1. Check `cookie_secure` setting in `config.toml`
2. If `cookie_secure = true`, must use HTTPS
3. Ensure `credentials: 'include'` in frontend fetch

### 401 on Every Request

1. Check browser console for cookie
2. Verify `credentials: 'include'` in fetch
3. Check CORS settings if frontend on different domain
4. Verify JWT secret matches in config

### Session Expired Too Quickly

1. Check `rememberMe` value in login request
2. Verify expiration calculation in `internal/utils/session.go:14-21`
3. Check database `expires_at` field

### Account Locked

1. Check `failed_login_attempts` in database
2. Reset manually: `UPDATE users SET failed_login_attempts = 0 WHERE email = 'user@example.com'`
3. Consider implementing "unlock after X minutes" feature

## Future Enhancements

Possible improvements to consider:

1. **Refresh Tokens**: Implement refresh token mechanism for seamless re-authentication
2. **Multiple Sessions**: Track multiple active sessions per user
3. **Session Management UI**: Allow users to view and revoke active sessions
4. **Password Reset**: Email-based password reset flow
5. **Two-Factor Authentication**: TOTP or SMS-based 2FA
6. **Rate Limiting**: IP-based rate limiting for login attempts
7. **Email Verification**: Require email verification before login
8. **OAuth Integration**: Google, Facebook, etc. login
9. **Audit Logging**: Detailed authentication event logging
10. **Auto-Unlock**: Automatically unlock accounts after time period
