<script lang="ts">
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
	import { faArrowDown, faArrowUp, faCloudUploadAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
	import { _ } from 'svelte-i18n';

	interface ImagePreview {
		file: File;
		url: string;
		displayOrder: number;
	}

	interface Props {
		images?: ImagePreview[];
		maxImages?: number;
		maxSizeMB?: number;
		onImagesChange?: (images: ImagePreview[]) => void;
	}

	let { images = $bindable([]), maxImages = 10, maxSizeMB = 10, onImagesChange }: Props = $props();

	let fileInput: HTMLInputElement;
	let dragOver = $state(false);
	let draggedIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);

	const handleFileSelect = (event: Event) => {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			processFiles(Array.from(target.files));
		}
	};

	const handleDrop = (event: DragEvent) => {
		event.preventDefault();
		dragOver = false;

		if (event.dataTransfer?.files) {
			processFiles(Array.from(event.dataTransfer.files));
		}
	};

	const processFiles = (files: File[]) => {
		const validFiles = files.filter((file) => {
			if (!file.type.startsWith('image/')) {
				alert($_('properties.imageUpload.invalidType'));
				return false;
			}

			if (file.size > maxSizeMB * 1024 * 1024) {
				alert($_('properties.imageUpload.fileTooLarge', { values: { size: maxSizeMB } }));
				return false;
			}

			return true;
		});

		if (images.length + validFiles.length > maxImages) {
			alert($_('properties.imageUpload.maxImagesReached', { values: { max: maxImages } }));
			return;
		}

		const newImages: ImagePreview[] = validFiles.map((file, index) => ({
			file,
			url: URL.createObjectURL(file),
			displayOrder: images.length + index
		}));

		images = [...images, ...newImages];
		if (onImagesChange) {
			onImagesChange(images);
		}
	};

	const removeImage = (index: number) => {
		URL.revokeObjectURL(images[index].url);
		images = images.filter((_, i) => i !== index);
		// Reorder display order
		images = images.map((img, i) => ({ ...img, displayOrder: i }));
		if (onImagesChange) {
			onImagesChange(images);
		}
	};

	const moveImage = (index: number, direction: 'up' | 'down') => {
		if (direction === 'up' && index === 0) return;
		if (direction === 'down' && index === images.length - 1) return;

		const newIndex = direction === 'up' ? index - 1 : index + 1;
		const newImages = [...images];
		[newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
		// Update display order
		images = newImages.map((img, i) => ({ ...img, displayOrder: i }));
		if (onImagesChange) {
			onImagesChange(images);
		}
	};

	const openFilePicker = () => {
		fileInput.click();
	};

	const handleImageDragStart = (index: number) => {
		draggedIndex = index;
	};

	const handleImageDragOver = (event: DragEvent, index: number) => {
		event.preventDefault();
		dragOverIndex = index;
	};

	const handleImageDragEnd = () => {
		if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
			const newImages = [...images];
			const [draggedImage] = newImages.splice(draggedIndex, 1);
			newImages.splice(dragOverIndex, 0, draggedImage);
			images = newImages.map((img, i) => ({ ...img, displayOrder: i }));
			if (onImagesChange) {
				onImagesChange(images);
			}
		}
		draggedIndex = null;
		dragOverIndex = null;
	};
</script>

<div class="space-y-4">
	<!-- Upload area -->
	<div
		role="button"
		tabindex="0"
		class="relative overflow-hidden rounded-lg border-2 border-dashed transition-colors {dragOver
			? 'border-primary-600 bg-primary-50 dark:border-primary-400 dark:bg-primary-950'
			: 'border-light-600 bg-light-50 dark:border-dark-600 dark:bg-dark-700'}"
		ondragover={(e) => {
			e.preventDefault();
			dragOver = true;
		}}
		ondragleave={() => (dragOver = false)}
		ondrop={handleDrop}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				openFilePicker();
			}
		}}
	>
		<input bind:this={fileInput} type="file" accept="image/*" multiple onchange={handleFileSelect} class="hidden" />

		<button
			type="button"
			onclick={openFilePicker}
			class="w-full p-8 text-center transition-colors hover:bg-light-100 dark:hover:bg-dark-600"
		>
			<FontAwesomeIcon
				icon={faCloudUploadAlt}
				class="mb-3 text-5xl {dragOver
					? 'text-primary-600 dark:text-primary-400'
					: 'text-dark-300 dark:text-light-400'}"
			/>
			<p class="mb-1 text-sm font-medium text-dark-900 dark:text-light-50">
				{$_('properties.imageUpload.clickOrDrag')}
			</p>
			<p class="text-xs text-dark-400 dark:text-light-500">
				{$_('properties.imageUpload.requirements', { values: { size: maxSizeMB, max: maxImages } })}
			</p>
		</button>
	</div>

	<!-- Image previews -->
	{#if images.length > 0}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
			{#each images as image, index (image.url)}
				<div
					role="listitem"
					draggable="true"
					ondragstart={() => handleImageDragStart(index)}
					ondragover={(e) => handleImageDragOver(e, index)}
					ondragend={handleImageDragEnd}
					class="group relative overflow-hidden rounded-lg border border-light-600 bg-light-50 transition-all dark:border-dark-600 dark:bg-dark-700 {draggedIndex ===
					index
						? 'scale-95 opacity-50'
						: ''} {dragOverIndex === index && draggedIndex !== index
						? 'scale-105 border-primary-600 dark:border-primary-400'
						: ''}"
					style="cursor: grab;"
				>
					<!-- Image -->
					<div class="relative aspect-square overflow-hidden bg-light-200 dark:bg-dark-600">
						<img src={image.url} alt="Preview {index + 1}" class="h-full w-full object-cover" />

						<!-- Primary badge -->
						{#if index === 0}
							<div class="absolute top-2 left-2">
								<span class="rounded bg-primary-600 px-2 py-1 text-xs font-semibold text-light-50">
									{$_('properties.imageUpload.primary')}
								</span>
							</div>
						{/if}

						<!-- Action buttons -->
						<div
							class="absolute inset-0 flex items-center justify-center gap-2 bg-dark-900/50 opacity-0 transition-opacity group-hover:opacity-100"
						>
							{#if index > 0}
								<button
									type="button"
									onclick={() => moveImage(index, 'up')}
									class="rounded-lg bg-light-50 p-2 transition-colors hover:bg-light-100"
									title={$_('properties.imageUpload.moveUp')}
								>
									<FontAwesomeIcon icon={faArrowUp} class="h-4 w-4 text-dark-900" />
								</button>
							{/if}

							{#if index < images.length - 1}
								<button
									type="button"
									onclick={() => moveImage(index, 'down')}
									class="rounded-lg bg-light-50 p-2 transition-colors hover:bg-light-100"
									title={$_('properties.imageUpload.moveDown')}
								>
									<FontAwesomeIcon icon={faArrowDown} class="h-4 w-4 text-dark-900" />
								</button>
							{/if}

							<button
								type="button"
								onclick={() => removeImage(index)}
								class="rounded-lg bg-error-600 p-2 transition-colors hover:bg-error-700"
								title={$_('properties.imageUpload.remove')}
							>
								<FontAwesomeIcon icon={faTrash} class="h-4 w-4 text-light-50" />
							</button>
						</div>
					</div>

					<!-- Order number -->
					<div class="p-2 text-center">
						<p class="text-xs text-dark-600 dark:text-light-400">
							{$_('properties.imageUpload.imageNumber', { values: { number: index + 1 } })}
						</p>
					</div>
				</div>
			{/each}
		</div>

		<p class="text-xs text-dark-400 dark:text-light-500">
			{$_('properties.imageUpload.reorderHint')}
		</p>
	{/if}
</div>
