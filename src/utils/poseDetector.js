/**
 * MediaPipe Pose Landmark Detection Service for Ergonomic Posture Assessment
 */

class PoseDetectorService {
  constructor() {
    this.poseLandmarker = null;
    this.isLoading = false;
    this.initPromise = null;
    this.lastDetection = null;
  }

  async getModule() {
    try {
      // Use CDN ESM which works natively across modern browsers and Vite
      const mod = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm');
      return mod;
    } catch (cdnErr) {
      console.warn('[PoseDetector] CDN import failed, trying local package:', cdnErr);
      const mod = await import('@mediapipe/tasks-vision');
      return mod;
    }
  }

  async init() {
    if (this.poseLandmarker) return this.poseLandmarker;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      this.isLoading = true;
      try {
        const { FilesetResolver, PoseLandmarker } = await this.getModule();

        let vision;
        try {
          vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
        } catch (wasmCdnErr) {
          console.warn('[PoseDetector] CDN wasm failed, trying local /wasm:', wasmCdnErr);
          vision = await FilesetResolver.forVisionTasks('/wasm');
        }

        const modelUrls = [
          '/models/pose_landmarker_full.task',
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
        ];

        let landmarker = null;
        for (const modelUrl of modelUrls) {
          try {
            landmarker = await PoseLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: modelUrl,
                delegate: 'GPU'
              },
              runningMode: 'IMAGE',
              numPoses: 1,
              minPoseDetectionConfidence: 0.25,
              minPosePresenceConfidence: 0.25,
              minTrackingConfidence: 0.25
            });
            if (landmarker) {
              console.log(`[PoseDetector] Loaded model successfully with GPU from: ${modelUrl}`);
              break;
            }
          } catch (gpuErr) {
            console.warn(`[PoseDetector] GPU load failed for ${modelUrl}, trying CPU:`, gpuErr);
            try {
              landmarker = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                  modelAssetPath: modelUrl,
                  delegate: 'CPU'
                },
                runningMode: 'IMAGE',
                numPoses: 1,
                minPoseDetectionConfidence: 0.25,
                minPosePresenceConfidence: 0.25,
                minTrackingConfidence: 0.25
              });
              if (landmarker) {
                console.log(`[PoseDetector] Loaded model successfully with CPU from: ${modelUrl}`);
                break;
              }
            } catch (cpuErr) {
              console.warn(`[PoseDetector] CPU load also failed for ${modelUrl}:`, cpuErr);
            }
          }
        }

        if (!landmarker) {
          throw new Error('Failed to initialize PoseLandmarker with all model sources');
        }

        this.poseLandmarker = landmarker;
        return this.poseLandmarker;
      } catch (err) {
        console.error('[PoseDetector] Initialization fatal error:', err);
        this.initPromise = null;
        throw err;
      } finally {
        this.isLoading = false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Detect pose landmarks on an HTMLImageElement or HTMLCanvasElement
   * @param {HTMLImageElement|HTMLCanvasElement} imageElement
   * @param {Object} [options]
   * @param {'auto'|'left'|'right'} [options.preferredSide='auto']
   * @returns {Promise<Object|null>}
   */
  async detectPose(imageElement, options = {}) {
    try {
      const landmarker = await this.init();
      if (!landmarker) return null;

      const results = landmarker.detect(imageElement);
      if (!results || !results.landmarks || results.landmarks.length === 0) {
        console.warn('[PoseDetector] No pose landmarks detected.');
        return null;
      }

      const lm = results.landmarks[0];
      const preferredSide = options.preferredSide || 'auto';
      const extracted = this.extractErgonomicPoints(lm, imageElement.width, imageElement.height, preferredSide);
      this.lastDetection = { lm, imgW: imageElement.width, imgH: imageElement.height, extracted };
      return extracted;
    } catch (err) {
      console.error('[PoseDetector] Detection error:', err);
      return null;
    }
  }

  /**
   * Re-extract landmarks for the opposite side or specified side
   */
  switchSide(side = 'toggle') {
    if (!this.lastDetection) return null;
    const { lm, imgW, imgH, extracted } = this.lastDetection;
    let targetSide = side;
    if (side === 'toggle') {
      targetSide = extracted.side === 'right' ? 'left' : 'right';
    }
    const newExtracted = this.extractErgonomicPoints(lm, imgW, imgH, targetSide);
    this.lastDetection.extracted = newExtracted;
    return newExtracted;
  }

  /**
   * Map 33 MediaPipe landmarks to ergonomic assessment points
   */
  extractErgonomicPoints(lm, imgWidth, imgHeight, preferredSide = 'auto') {
    // MediaPipe landmark indices:
    // Left: shoulder 11, elbow 13, wrist 15, hip 23, knee 25, ankle 27, eye 2, ear 7
    // Right: shoulder 12, elbow 14, wrist 16, hip 24, knee 26, ankle 28, eye 5, ear 8

    const rightScore = (lm[12]?.visibility ?? 0) + (lm[14]?.visibility ?? 0) + (lm[16]?.visibility ?? 0) + 
                       (lm[24]?.visibility ?? 0) + (lm[26]?.visibility ?? 0) + (lm[28]?.visibility ?? 0);
    const leftScore = (lm[11]?.visibility ?? 0) + (lm[13]?.visibility ?? 0) + (lm[15]?.visibility ?? 0) + 
                      (lm[23]?.visibility ?? 0) + (lm[25]?.visibility ?? 0) + (lm[27]?.visibility ?? 0);

    let useRight;
    if (preferredSide === 'right') {
      useRight = true;
    } else if (preferredSide === 'left') {
      useRight = false;
    } else {
      useRight = rightScore >= leftScore;
    }

    const side = useRight ? 'right' : 'left';
    const sideLabel = useRight ? 'ขวา' : 'ซ้าย';

    const pShoulder = useRight ? lm[12] : lm[11];
    const pElbow = useRight ? lm[14] : lm[13];
    const pWrist = useRight ? lm[16] : lm[15];
    const pHip = useRight ? lm[24] : lm[23];
    const pKnee = useRight ? lm[26] : lm[25];
    const pAnkle = useRight ? lm[28] : lm[27];
    const pEye = useRight ? (lm[5] || lm[2] || lm[0]) : (lm[2] || lm[5] || lm[0]);
    const pNose = lm[0] || pEye;

    // Detect direction person is facing
    // If wrist or nose X > shoulder X, facing right; otherwise left
    const facingRight = (pNose.x > pShoulder.x) || (pWrist.x > pShoulder.x);

    // Screen estimate: in front of eye in the gaze direction
    let screenX;
    if (facingRight) {
      screenX = Math.min(0.96, Math.max(pWrist.x + 0.08, pEye.x + 0.30));
    } else {
      screenX = Math.max(0.04, Math.min(pWrist.x - 0.08, pEye.x - 0.30));
    }
    const screenY = pEye.y;

    // Helper to clamp within visible canvas area
    const clamp = (val, min = 0.02, max = 0.98) => Math.max(min, Math.min(max, Number(val.toFixed(4))));

    // Handle occluded or cut-off ankle: if ankle is below bottom of image, clamp to 0.94
    let ankleY = pAnkle?.y ?? (pKnee.y + 0.25);
    if (ankleY > 0.96) ankleY = 0.94;

    return {
      side,
      sideLabel,
      facingRight,
      confidence: useRight ? (rightScore / 6) : (leftScore / 6),
      canSwitch: true,
      points: {
        shoulder: {
          x: clamp(pShoulder.x),
          y: clamp(pShoulder.y),
          name: `หัวไหล่ (${sideLabel})`,
          group: 'elbow'
        },
        elbow: {
          x: clamp(pElbow.x),
          y: clamp(pElbow.y),
          name: `ข้อศอก (${sideLabel})`,
          group: 'elbow',
          isVertex: true
        },
        wrist: {
          x: clamp(pWrist.x),
          y: clamp(pWrist.y),
          name: `ข้อมือ (${sideLabel})`,
          group: 'elbow'
        },
        hip: {
          x: clamp(pHip.x),
          y: clamp(pHip.y),
          name: `สะโพก (${sideLabel})`,
          group: 'hip',
          isVertex: true
        },
        knee: {
          x: clamp(pKnee.x),
          y: clamp(pKnee.y),
          name: `เข่า (${sideLabel})`,
          group: 'knee',
          isVertex: true
        },
        ankle: {
          x: clamp(pAnkle.x),
          y: clamp(ankleY),
          name: `ข้อเท้า (${sideLabel})`,
          group: 'knee'
        },
        eye: {
          x: clamp(pEye.x),
          y: clamp(pEye.y),
          name: 'ระดับสายตา (Eye)',
          group: 'eye'
        },
        screen: {
          x: clamp(screenX),
          y: clamp(screenY),
          name: 'กึ่งกลางจอ (Screen)',
          group: 'eye'
        }
      }
    };
  }
}

export const poseDetector = new PoseDetectorService();
