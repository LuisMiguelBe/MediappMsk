import { Camera } from "@mediapipe/camera_utils";
import { Holistic } from "@mediapipe/holistic";
import {
    ApplicationContext,
    FacemojiAPI,
    FaceTracker,
    ResourceFileSystem
} from '@0xalter/mocap4face'

import { setPose, setFingers, setMorphs, setBlendshapes } from "./avatar";

// device constants
const WIDTH = 1920;
const HEIGHT = 1080;

export function PoseDetector(preload, videoInput) {
    const holistic = new Holistic({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
    }});

    holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    holistic.onResults((results) => {
        preload.hidden = true;

        let poseLandmarks = results.poseLandmarks;
        let poseWorldLandmarks = results.ea;
        if (poseWorldLandmarks) {
            //setPose(poseLandmarks, poseWorldLandmarks);
        }
    
        let leftHandLandmarks = results.leftHandLandmarks;
        if (leftHandLandmarks) {
            //setFingers(leftHandLandmarks, false);
        }
    
        let rightHandLandmarks = results.rightHandLandmarks;
        if (rightHandLandmarks) {
            //setFingers(rightHandLandmarks, true);
        }
    
        let faceLandmarks = results.faceLandmarks;
        if (faceLandmarks) {
            setMorphs(faceLandmarks);
        }
    });

    // from https://github.com/facemoji/mocap4face/blob/main/js-example/src/index.ts
    FacemojiAPI.initialize(process.env.NEXT_PUBLIC_MOCAP4FACE_KEY, context).then((activated) => {
        if (activated) {
            console.info('API successfully activated');
        } else {
            console.info('API could not be activated');
        }
    });

    const context = new ApplicationContext('https://cdn.jsdelivr.net/npm/@0xalter/mocap4face@0.3.0');
    const fs = new ResourceFileSystem(context);

    const asyncTracker = FaceTracker.createVideoTracker(fs)
        .then((tracker) => {
            return tracker;
        })
        .logError('Could not start tracking');


    const camera = new Camera(videoInput, {
        onFrame: async () => {
            await holistic.send({image: videoInput});

            const tracker = asyncTracker.currentValue;
            const m4fResult = tracker.track(videoInput);
            setBlendshapes(m4fResult["_blendshapes"]["_innerMap"]);
        },
        width: WIDTH,
        height: HEIGHT
    });

    return [holistic, camera];
}