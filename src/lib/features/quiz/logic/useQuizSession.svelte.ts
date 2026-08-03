import type { MCQ, QCMSynthese } from '$lib/types/database';

export function createQuizSession(initialQcm: QCMSynthese | MCQ | null, onAnswerCallback?: (result: { score: number; isCorrect: boolean; selectedIndex: number }) => void) {
	let qcm = $state(initialQcm);
	let selectedIndex = $state<number | null>(null);
	let disabled = $state(false);
	let isStarted = $state(false);


	function setQcm(newQcm: QCMSynthese | MCQ | null) {
		qcm = newQcm;
		selectedIndex = null; // Reset answer on new question
		isStarted = false;
	}

	function setDisabled(val: boolean) {
		disabled = val;
	}

	function startQuiz() {
		isStarted = true;
	}

	function selectOption(index: number) {
		if (selectedIndex !== null || disabled || !qcm) return;

		selectedIndex = index;
		const correct = index === qcm.correctIndex;
		const score = correct ? 100 : 0;

		if (onAnswerCallback) {
			onAnswerCallback({ score, isCorrect: correct, selectedIndex: index });
		}
	}

	return {
		get qcm() { return qcm; },
		get selectedIndex() { return selectedIndex; },
		get isAnswered() { return selectedIndex !== null; },
		get isCorrect() { return qcm && selectedIndex !== null ? selectedIndex === qcm.correctIndex : false; },
		get disabled() { return disabled; },
		get isStarted() { return isStarted; },
		setQcm,
		setDisabled,
		startQuiz,
		selectOption
	};
}
