<script setup>
import { computed, ref, inject, watch } from 'vue'
import MediaLibraryModal from '../../../Modals/MediaLibraryModal.vue'
import { sharedPageBuilderStore } from '../../../../stores/shared-store'
import { preloadImage } from '../../../../composables/preloadImage'
import { delay } from '../../../../composables/delay'
import { useTranslations } from '../../../../composables/useTranslations'
import { getPageBuilder } from '../../../../composables/builderInstance'

const { translate } = useTranslations()

// Use shared store instance
const pageBuilderStateStore = sharedPageBuilderStore
const customMediaComponent = inject('CustomMediaComponent')
const pageBuilderService = getPageBuilder()

const getIsLoadingImage = ref(false)

const showMediaLibraryModal = ref(false)
// modal content
const titleMedia = ref('')
const descriptionMedia = ref('')
const firstButtonMedia = ref('')
const secondButtonMedia = ref(null)
const thirdButtonMedia = ref(null)
// set dynamic modal handle functions
const firstMediaButtonFunction = ref(null)

const getSelectedElement = computed(() => pageBuilderStateStore.getElement)
const getSelectedMediaType = computed(() => pageBuilderService.getSelectedMediaType())

const getBasePrimaryImage = computed(() => pageBuilderStateStore.getBasePrimaryImage)

const handleAddImage = function () {
  // open modal to true
  showMediaLibraryModal.value = true

  titleMedia.value =
    getSelectedMediaType.value === 'video'
      ? translate('Video Library')
      : getSelectedMediaType.value === 'embed'
        ? translate('Embed Library')
        : translate('Media Library')
  descriptionMedia.value = null
  firstButtonMedia.value = translate('Close')
  secondButtonMedia.value =
    getSelectedMediaType.value === 'video'
      ? translate('Select video')
      : getSelectedMediaType.value === 'embed'
        ? translate('Select embed')
        : translate('Select image')

  // handle click
  firstMediaButtonFunction.value = function () {
    showMediaLibraryModal.value = false
  }
  //
  // end modal
}

const loadingImage = async function (imageURL) {
  getIsLoadingImage.value = true

  if (!imageURL || typeof imageURL !== 'string' || imageURL.length <= 2) {
    getIsLoadingImage.value = false
    return
  }

  try {
    await preloadImage(imageURL)
    await delay(200)
  } catch {
    // If preview loading fails, do not leave the sidebar stuck in a spinner state.
  } finally {
    getIsLoadingImage.value = false
  }
}

watch(getSelectedElement, () => {
  showMediaLibraryModal.value = false
})

watch(
  getBasePrimaryImage,
  async (newValue) => {
    if (getSelectedMediaType.value !== 'image') {
      getIsLoadingImage.value = false
      return
    }

    await loadingImage(newValue)
  },
  { immediate: true },
)
</script>
<template>
  <div>
    <div v-show="getIsLoadingImage">
      <div class="pbx-flex pbx-items-center pbx-justify-center pbx-mt-4 pbx-min-h-80">
        <div
          class="pbx-inline-block pbx-h-8 pbx-w-8 pbx-animate-spin pbx-rounded-full pbx-border-4 pbx-border-solid pbx-border-current pbx-border-r-transparent pbx-align-[-0.125em] motion-reduce:pbx-animate-[spin_1.5s_linear_infinite]"
        >
          <span
            class="!pbx-absolute !pbx-m-px !pbx-h-px !pbx-w-px !pbx-overflow-hidden !pbx-whitespace-nowrap !pbx-border-0 !pbx-p-0 !pbx-[clip:rect(0,0,0,0)]"
            >Loading...</span
          >
        </div>
      </div>
    </div>
    <div v-show="getBasePrimaryImage && !getIsLoadingImage && getSelectedMediaType === 'image'">
      <img
        class="pbx-object-cover pbx-object-center pbx-w-full pbx-cursor-pointer"
        :src="getBasePrimaryImage"
        @click="handleAddImage"
        alt="image"
      />
    </div>
    <div v-show="getBasePrimaryImage && !getIsLoadingImage && getSelectedMediaType === 'video'">
      <video
        class="pbx-w-full pbx-cursor-pointer pbx-rounded-lg pbx-bg-black"
        :src="getBasePrimaryImage"
        controls
        @click="handleAddImage"
      ></video>
    </div>
    <div v-show="getBasePrimaryImage && !getIsLoadingImage && getSelectedMediaType === 'embed'">
      <button
        type="button"
        class="pbx-w-full pbx-min-h-48 pbx-rounded-2xl pbx-border pbx-border-gray-200 pbx-bg-gray-50 pbx-p-4 pbx-text-left"
        @click="handleAddImage"
      >
        <p class="pbx-font-medium pbx-mb-2">{{ translate('Selected embed') }}</p>
        <p class="pbx-text-sm pbx-text-gray-500 pbx-break-all">{{ getBasePrimaryImage }}</p>
      </button>
    </div>
    <MediaLibraryModal
      :open="showMediaLibraryModal"
      :title="titleMedia"
      :description="descriptionMedia"
      :firstButtonText="firstButtonMedia"
      :secondButtonText="secondButtonMedia"
      :thirdButtonText="thirdButtonMedia"
      :customMediaComponent="customMediaComponent"
      @firstMediaButtonFunction="firstMediaButtonFunction"
    >
    </MediaLibraryModal>
  </div>
</template>
