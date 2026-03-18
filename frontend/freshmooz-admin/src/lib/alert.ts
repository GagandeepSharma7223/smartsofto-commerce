import Swal from "sweetalert2"

type ConfirmActionOptions = {
  title: string
  text: string
  confirmText?: string
  cancelText?: string
}

export async function confirmAction({
  title,
  text,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ConfirmActionOptions): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    reverseButtons: true,
    focusCancel: true,
  })

  return result.isConfirmed
}

export function showSuccess(message: string) {
  return Swal.fire({
    title: "Success",
    text: message,
    icon: "success",
    confirmButtonColor: "#6FAF3D",
  })
}

export function showError(message: string, title = "Something went wrong") {
  return Swal.fire({
    title,
    text: message,
    icon: "error",
    confirmButtonColor: "#d33",
  })
}

export function showWarning(message: string, title = "Warning") {
  return Swal.fire({
    title,
    text: message,
    icon: "warning",
    confirmButtonColor: "#d33",
  })
}
