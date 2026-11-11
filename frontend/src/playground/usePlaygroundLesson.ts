import { useEffect, useState } from "react";
import type { Lesson } from "../types/lesson";
import type { AppRoute } from "../app/routes";
import {
    createPlaygroundDraftId,
    decodePlaygroundLesson,
} from "./lessonPayload";
import {
    playgroundScratchLesson,
    PLAYGROUND_SCRATCH_DRAFT_ID,
} from "./scratchLesson";

export type PlaygroundLessonState =
    | { kind: "empty" }
    | { kind: "loading" }
    | { kind: "invalid"; message: string }
    | { kind: "ready"; lesson: Lesson; draftId: string; isScratch: boolean };

const emptyState: PlaygroundLessonState = { kind: "empty" };

type PlaygroundPayloadState =
    | { kind: "empty" }
    | { kind: "invalid"; message: string }
    | { kind: "scratch" }
    | { kind: "payload"; lesson: Lesson; canonicalJson: string };

const decodePlaygroundPayload = (
    route: Extract<AppRoute, { kind: "playground" }>,
): PlaygroundPayloadState => {
    if (route.payloadError) {
        return { kind: "invalid", message: route.payloadError };
    }

    if (!route.encodedLesson) {
        return { kind: "scratch" };
    }

    const result = decodePlaygroundLesson(route.encodedLesson);

    if (!result.ok) {
        return { kind: "invalid", message: result.message };
    }

    return {
        kind: "payload",
        lesson: result.lesson,
        canonicalJson: result.canonicalJson,
    };
};

const getPlaygroundPayloadState = (route: AppRoute): PlaygroundPayloadState =>
    route.kind === "playground"
        ? decodePlaygroundPayload(route)
        : { kind: "empty" };

const resolvePayloadState = (
    payload: PlaygroundPayloadState,
): Promise<PlaygroundLessonState> => {
    if (payload.kind === "scratch") {
        return Promise.resolve({
            kind: "ready",
            lesson: playgroundScratchLesson,
            draftId: PLAYGROUND_SCRATCH_DRAFT_ID,
            isScratch: true,
        });
    }

    if (payload.kind === "payload") {
        return createPlaygroundDraftId(payload.canonicalJson).then(
            (draftId) => ({
                kind: "ready",
                lesson: payload.lesson,
                draftId,
                isScratch: false,
            }),
            () => ({
                kind: "invalid",
                message: "This browser could not prepare the Playground lesson.",
            }),
        );
    }

    return Promise.resolve(payload);
};

const resolvePlaygroundLesson = (route: AppRoute) =>
    resolvePayloadState(getPlaygroundPayloadState(route));

export const usePlaygroundLesson = (route: AppRoute): PlaygroundLessonState => {
    const [state, setState] = useState<PlaygroundLessonState>(emptyState);

    useEffect(() => {
        let isActive = true;
        const pending = resolvePlaygroundLesson(route);

        if (route.kind === "playground" && route.encodedLesson && !route.payloadError) {
            setState({ kind: "loading" });
        }

        void pending.then((nextState) => {
            if (isActive) {
                setState(nextState);
            }
        });

        return () => {
            isActive = false;
        };
    }, [route]);

    return state;
};