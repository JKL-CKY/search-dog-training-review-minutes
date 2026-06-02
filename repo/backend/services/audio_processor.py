import os
import numpy as np
import librosa
import soundfile as sf
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import tempfile
from ..config import settings


class AudioProcessor:
    def __init__(self):
        self.sample_rate = 16000
        self.output_dir = settings.PROCESSED_DIR
        os.makedirs(self.output_dir, exist_ok=True)

    def reduce_noise(self, audio_path: str) -> str:
        y, sr = librosa.load(audio_path, sr=self.sample_rate)
        
        noise_reduced = self._spectral_subtraction(y, sr)
        noise_reduced = self._remove_bark_howl(noise_reduced, sr)
        noise_reduced = self._remove_wind_noise(noise_reduced, sr)
        
        output_path = os.path.join(
            self.output_dir,
            f"denoised_{Path(audio_path).stem}.wav"
        )
        sf.write(output_path, noise_reduced, sr)
        return output_path

    def _spectral_subtraction(self, y: np.ndarray, sr: int) -> np.ndarray:
        n_fft = 2048
        hop_length = 512
        
        D = librosa.stft(y, n_fft=n_fft, hop_length=hop_length)
        magnitude, phase = librosa.magphase(D)
        
        noise_mag = np.mean(magnitude[:, :10], axis=1, keepdims=True)
        alpha = 2.0
        beta = 0.01
        
        cleaned_mag = np.maximum(magnitude - alpha * noise_mag, beta * noise_mag)
        cleaned_D = cleaned_mag * phase
        
        y_cleaned = librosa.istft(cleaned_D, hop_length=hop_length)
        return y_cleaned

    def _remove_bark_howl(self, y: np.ndarray, sr: int) -> np.ndarray:
        bark_freq_range = (200, 2000)
        
        D = librosa.stft(y, n_fft=2048, hop_length=512)
        magnitude, phase = librosa.magphase(D)
        freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
        
        bark_band = (freqs >= bark_freq_range[0]) & (freqs <= bark_freq_range[1])
        
        energy = np.sum(magnitude ** 2, axis=0)
        bark_energy = np.sum(magnitude[bark_band, :] ** 2, axis=0)
        bark_ratio = bark_energy / (energy + 1e-10)
        
        bark_mask = bark_ratio > 0.7
        magnitude[bark_band, :][:, bark_mask] *= 0.1
        
        cleaned_D = magnitude * phase
        y_cleaned = librosa.istft(cleaned_D, hop_length=512)
        return y_cleaned

    def _remove_wind_noise(self, y: np.ndarray, sr: int) -> np.ndarray:
        wind_freq_range = (0, 200)
        
        D = librosa.stft(y, n_fft=4096, hop_length=512)
        magnitude, phase = librosa.magphase(D)
        freqs = librosa.fft_frequencies(sr=sr, n_fft=4096)
        
        wind_band = freqs <= wind_freq_range[1]
        
        wind_energy = np.sum(magnitude[wind_band, :] ** 2, axis=0)
        total_energy = np.sum(magnitude ** 2, axis=0)
        wind_ratio = wind_energy / (total_energy + 1e-10)
        
        wind_mask = wind_ratio > 0.5
        magnitude[wind_band, :][:, wind_mask] *= 0.05
        
        cleaned_D = magnitude * phase
        y_cleaned = librosa.istft(cleaned_D, hop_length=512)
        return y_cleaned

    def transcribe_with_whisper(self, audio_path: str) -> Tuple[str, List[Dict[str, Any]]]:
        try:
            import whisper
            model = whisper.load_model("base")
            result = model.transcribe(
                audio_path,
                language="zh",
                word_timestamps=True,
                verbose=False
            )
            
            full_text = result["text"]
            segments = []
            for seg in result["segments"]:
                segments.append({
                    "start": seg["start"],
                    "end": seg["end"],
                    "text": seg["text"].strip()
                })
            
            return full_text, segments
        except Exception as e:
            return f"[转录失败: {str(e)}]", []

    def diarize_speakers(self, audio_path: str) -> List[Dict[str, Any]]:
        try:
            from pyannote.audio import Pipeline
            pipeline = Pipeline.from_pretrained(
                "pyannote/speaker-diarization-3.1",
                use_auth_token=settings.HF_TOKEN
            )
            
            diarization = pipeline(audio_path)
            
            speaker_segments = []
            for turn, _, speaker in diarization.itertracks(yield_label=True):
                speaker_segments.append({
                    "speaker": speaker,
                    "start": turn.start,
                    "end": turn.end,
                    "duration": turn.end - turn.start
                })
            
            return speaker_segments
        except Exception as e:
            return [{"error": f"说话人识别失败: {str(e)}", "speaker": "UNKNOWN"}]

    def merge_transcription_and_diarization(
        self,
        segments: List[Dict[str, Any]],
        diarization: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        merged = []
        for seg in segments:
            speaker = self._find_speaker(seg["start"], seg["end"], diarization)
            merged.append({
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"],
                "speaker": speaker
            })
        return merged

    def _find_speaker(self, start: float, end: float, diarization: List[Dict[str, Any]]) -> str:
        mid_time = (start + end) / 2
        for seg in diarization:
            if "error" in seg:
                continue
            if seg["start"] <= mid_time <= seg["end"]:
                return seg["speaker"]
        return "UNKNOWN"


audio_processor = AudioProcessor()
