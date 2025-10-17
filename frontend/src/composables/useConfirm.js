import { ref } from 'vue'

const confirmState = ref({
  show: false,
  title: 'Confirm Action',
  message: '',
  variant: 'danger',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  resolve: null,
  reject: null
})

export function useConfirm() {
  const confirm = ({ 
    title = 'Confirm Action', 
    message, 
    variant = 'danger',
    confirmText = 'Confirm',
    cancelText = 'Cancel'
  }) => {
    return new Promise((resolve, reject) => {
      confirmState.value = {
        show: true,
        title,
        message,
        variant,
        confirmText,
        cancelText,
        resolve,
        reject
      }
    })
  }

  const handleConfirm = () => {
    if (confirmState.value.resolve) {
      confirmState.value.resolve(true)
    }
    confirmState.value.show = false
  }

  const handleCancel = () => {
    if (confirmState.value.reject) {
      confirmState.value.reject(false)
    }
    confirmState.value.show = false
  }

  return {
    confirmState,
    confirm,
    handleConfirm,
    handleCancel
  }
}

export default useConfirm
