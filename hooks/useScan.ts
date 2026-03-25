import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { AnalysisResult } from "@/lib/openai";

type ScanStatus = "idle" | "capturing" | "processing" | "complete" | "error";

export function useScan() {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickImage = useCallback(async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError("Photo library permission is required.");
        return null;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!pickerResult.canceled && pickerResult.assets[0]) {
        const asset = pickerResult.assets[0];
        setImageUri(asset.uri);
        setStatus("capturing");
        return asset;
      }
      return null;
    } catch (e) {
      setError("Failed to pick image");
      setStatus("error");
      return null;
    }
  }, []);

  const takePhoto = useCallback(async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError("Camera permission is required.");
        return null;
      }

      const pickerResult = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!pickerResult.canceled && pickerResult.assets[0]) {
        const asset = pickerResult.assets[0];
        setImageUri(asset.uri);
        setStatus("capturing");
        return asset;
      }
      return null;
    } catch (e) {
      setError("Failed to take photo");
      setStatus("error");
      return null;
    }
  }, []);

  const setAnalysisResult = useCallback((analysisResult: AnalysisResult) => {
    setResult(analysisResult);
    setStatus("complete");
  }, []);

  const startProcessing = useCallback(() => {
    setStatus("processing");
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setImageUri(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    status,
    imageUri,
    result,
    error,
    pickImage,
    takePhoto,
    startProcessing,
    setAnalysisResult,
    reset,
  };
}
