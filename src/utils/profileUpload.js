import { uploadProfilePicture as apiUpload } from "../config/appwrite";
import { store } from "../store";
import { updateProfilePictureUrl } from "../store/slices/userSlice";

/**
 * Upload a profile picture to the SQLite backend.
 * @param {File} file - The image file to upload
 * @param {string} _userId - Unused (kept for API compatibility)
 * @param {string} _currentImageId - Unused (handled server-side)
 */
export const uploadProfilePicture = async (file, _userId, _currentImageId) => {
  try {
    const res = await apiUpload(file);
    if (res.success && res.fileUrl) {
      store.dispatch(updateProfilePictureUrl(res.fileUrl));
      return { fileId: res.fileUrl, fileUrl: res.fileUrl };
    }
    throw new Error(res.error || "Upload failed");
  } catch (error) {
    throw new Error(`Failed to upload profile picture: ${error.message}`);
  }
};
