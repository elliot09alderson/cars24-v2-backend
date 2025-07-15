import CryptoJS from "crypto-js";
export const encryptToken = async (token, secretKey) => {
  console.log("encryptToken", token);
  return await CryptoJS.AES.encrypt(token, secretKey).toString();
};

export const decryptToken = (encryptedToken, secretKey) => {
  if (!encryptedToken || !secretKey) {
    throw new Error("Encrypted token and secret key are required");
  }
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Error during decryption:", error.message);
    throw new Error("Decryption error");
  }
};
