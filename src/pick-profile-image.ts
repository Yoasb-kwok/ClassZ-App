import * as ImagePicker from "expo-image-picker"

export async function pickProfileImage(): Promise<{ preview: string; dataUrl: string } | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) {
    throw new Error("Photo library permission is required.")
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  })
  if (result.canceled || !result.assets[0]) return null
  const asset = result.assets[0]
  const mime = asset.mimeType || "image/jpeg"
  const dataUrl = asset.base64
    ? `data:${mime};base64,${asset.base64}`
    : asset.uri.startsWith("data:")
      ? asset.uri
      : null
  if (!dataUrl) throw new Error("Could not read the selected image.")
  return { preview: asset.uri || dataUrl, dataUrl }
}
