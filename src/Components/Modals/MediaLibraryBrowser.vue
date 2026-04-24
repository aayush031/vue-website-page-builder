<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getPageBuilder } from '../../composables/builderInstance'
import { usePageBuilderModal } from '../../composables/usePageBuilderModal'
import { useTranslations } from '../../composables/useTranslations'

const pageBuilderService = getPageBuilder()
const { closeMediaLibraryModal } = usePageBuilderModal()
const { translate } = useTranslations()

const activeTab = ref<'computer' | 'url'>('computer')
const localPreviewSource = ref('')
const remoteSource = ref('')
const isApplying = ref(false)
const errorMessage = ref('')

const mediaType = computed(() => pageBuilderService.getSelectedMediaType())
const currentSource = computed(() => pageBuilderService.getSelectedMediaSource())

const selectedSource = computed(() => {
  if (activeTab.value === 'computer' && localPreviewSource.value) {
    return localPreviewSource.value
  }

  if (activeTab.value === 'url' && remoteSource.value.trim()) {
    return remoteSource.value.trim()
  }

  return ''
})

const fileInputAccept = computed(() => {
  if (mediaType.value === 'video') return 'video/*'
  if (mediaType.value === 'image') return 'image/*'
  return 'image/*,video/*'
})

const canUseComputerUpload = computed(() => mediaType.value !== 'embed')

watch(
  mediaType,
  (newType) => {
    if (newType === 'embed') {
      activeTab.value = 'url'
    }
  },
  { immediate: true },
)

watch(currentSource, (newValue) => {
  remoteSource.value = newValue || ''
})

const clearSelections = () => {
  localPreviewSource.value = ''
  errorMessage.value = ''
}

const handleFileChange = async (event: Event) => {
  clearSelections()

  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) return

  const isImageFile = file.type.startsWith('image/')
  const isVideoFile = file.type.startsWith('video/')

  if (mediaType.value === 'image' && !isImageFile) {
    errorMessage.value = 'Please choose an image file for this selection.'
    return
  }

  if (mediaType.value === 'video' && !isVideoFile) {
    errorMessage.value = 'Please choose a video file for this selection.'
    return
  }

  // LocalStorage-backed HTML gets heavy quickly with videos. Keep the first version conservative.
  if (isVideoFile && file.size > 2 * 1024 * 1024) {
    errorMessage.value =
      'This video is too large to save reliably in browser storage. Use a hosted video URL instead.'
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    localPreviewSource.value = typeof reader.result === 'string' ? reader.result : ''
  }
  reader.onerror = () => {
    errorMessage.value = 'We could not read this file. Please try another one.'
  }
  reader.readAsDataURL(file)
}

const applySelectedMedia = async () => {
  errorMessage.value = ''

  if (!selectedSource.value) {
    errorMessage.value = 'Select a file or enter a URL first.'
    return
  }

  isApplying.value = true
  await pageBuilderService.applySelectedMedia({
    src: selectedSource.value,
  })
  closeMediaLibraryModal()
  isApplying.value = false
}
</script>

<template>
  <div class="pbx-min-h-[28rem] pbx-flex pbx-flex-col pbx-gap-6">
    <div class="pbx-flex pbx-flex-wrap pbx-items-center pbx-gap-2 pbx-border-b pbx-border-gray-200 pbx-pb-4">
      <button
        v-if="canUseComputerUpload"
        type="button"
        @click="activeTab = 'computer'"
        class="pbx-mySecondaryButton pbx-text-sm"
        :class="[
          activeTab === 'computer'
            ? 'pbx-bg-myPrimaryLinkColor pbx-text-white hover:pbx-bg-myPrimaryLinkColor hover:pbx-text-white'
            : '',
        ]"
      >
        {{ translate('Computer') }}
      </button>
      <button
        type="button"
        @click="activeTab = 'url'"
        class="pbx-mySecondaryButton pbx-text-sm"
        :class="[
          activeTab === 'url'
            ? 'pbx-bg-myPrimaryLinkColor pbx-text-white hover:pbx-bg-myPrimaryLinkColor hover:pbx-text-white'
            : '',
        ]"
      >
        {{ mediaType === 'embed' ? translate('Embed URL') : translate('Media URL') }}
      </button>
    </div>

    <div class="pbx-grid pbx-grid-cols-1 lg:pbx-grid-cols-[1.2fr_0.8fr] pbx-gap-6">
      <section class="pbx-rounded-2xl pbx-border pbx-border-gray-200 pbx-p-4">
        <template v-if="activeTab === 'computer' && canUseComputerUpload">
          <label
            class="pbx-flex pbx-min-h-56 pbx-cursor-pointer pbx-flex-col pbx-items-center pbx-justify-center pbx-rounded-2xl pbx-border pbx-border-dashed pbx-border-gray-300 pbx-bg-gray-50 pbx-p-6 pbx-text-center"
          >
            <input
              class="pbx-hidden"
              type="file"
              :accept="fileInputAccept"
              @change="handleFileChange"
            />
            <span class="material-symbols-outlined pbx-text-3xl">upload</span>
            <p class="pbx-mt-3 pbx-font-medium">
              {{ translate('Choose media from your computer') }}
            </p>
            <p class="pbx-mt-2 pbx-text-sm pbx-text-gray-500">
              {{
                mediaType === 'video'
                  ? translate('Small videos work best here because the editor saves HTML in browser storage.')
                  : translate('Select an image file and it will be applied to the selected media area.')
              }}
            </p>
          </label>
        </template>

        <template v-if="activeTab === 'url'">
          <div class="pbx-flex pbx-flex-col pbx-gap-3">
            <label class="pbx-text-sm pbx-font-medium">
              {{
                mediaType === 'embed'
                  ? translate('Paste a video embed or YouTube link')
                  : translate('Paste an image or video URL')
              }}
            </label>
            <input
              v-model="remoteSource"
              type="url"
              class="pbx-myPrimarySearchInput pbx-w-full pbx-border pbx-border-gray-200"
              :placeholder="
                mediaType === 'embed'
                  ? 'https://www.youtube.com/watch?v=...'
                  : 'https://example.com/file.jpg'
              "
            />
            <p class="pbx-text-sm pbx-text-gray-500">
              {{
                mediaType === 'embed'
                  ? translate('YouTube watch links are converted to embed links automatically.')
                  : translate('Use a direct URL if you want media that stays lightweight in browser storage.')
              }}
            </p>
          </div>
        </template>

        <p v-if="errorMessage" class="pbx-mt-4 pbx-myPrimaryParagraphError">
          {{ errorMessage }}
        </p>
      </section>

      <aside class="pbx-rounded-2xl pbx-border pbx-border-gray-200 pbx-p-4">
        <p class="pbx-font-medium">{{ translate('Preview') }}</p>

        <div class="pbx-mt-4 pbx-rounded-2xl pbx-bg-gray-50 pbx-p-3">
          <template v-if="mediaType === 'image' && selectedSource">
            <img
              :src="selectedSource"
              alt="Selected media preview"
              class="pbx-w-full pbx-rounded-2xl pbx-object-cover pbx-aspect-square"
            />
          </template>

          <template v-else-if="mediaType === 'video' && selectedSource">
            <video
              :src="selectedSource"
              controls
              class="pbx-w-full pbx-rounded-2xl pbx-bg-black pbx-aspect-video"
            ></video>
          </template>

          <template v-else-if="mediaType === 'embed' && selectedSource">
            <div
              class="pbx-flex pbx-aspect-video pbx-items-center pbx-justify-center pbx-rounded-2xl pbx-bg-white pbx-border pbx-border-gray-200 pbx-p-4 pbx-text-center"
            >
              <p class="pbx-text-sm pbx-text-gray-600">{{ selectedSource }}</p>
            </div>
          </template>

          <template v-else-if="currentSource">
            <div
              class="pbx-flex pbx-min-h-40 pbx-items-center pbx-justify-center pbx-rounded-2xl pbx-border pbx-border-dashed pbx-border-gray-300 pbx-bg-white pbx-p-4 pbx-text-center"
            >
              <p class="pbx-text-sm pbx-text-gray-500">
                {{ translate('Current media is selected. Choose a new file or URL to replace it.') }}
              </p>
            </div>
          </template>

          <template v-else>
            <div
              class="pbx-flex pbx-min-h-40 pbx-items-center pbx-justify-center pbx-rounded-2xl pbx-border pbx-border-dashed pbx-border-gray-300 pbx-bg-white pbx-p-4 pbx-text-center"
            >
              <p class="pbx-text-sm pbx-text-gray-500">
                {{ translate('No media selected yet.') }}
              </p>
            </div>
          </template>
        </div>

        <div class="pbx-mt-4 pbx-flex pbx-justify-end">
          <button
            type="button"
            class="pbx-myPrimaryButton"
            :disabled="isApplying"
            @click="applySelectedMedia"
          >
            {{ isApplying ? translate('Applying...') : translate('Apply media') }}
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>
