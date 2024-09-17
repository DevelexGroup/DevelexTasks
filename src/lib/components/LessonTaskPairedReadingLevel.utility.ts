import type { PairedReadingTaskType } from '$lib/types/lesson';

export class PairedReadingIdManager {
	private static WORD_ID_PREFIX = 'fixw';
	private static WORD_REGEX = new RegExp(`^${this.WORD_ID_PREFIX}-(\\d+)-(\\d+)$`);
	private static FIXCROSS_A_ID = 'fixc-a';
	private static FIXCROSS_B_ID = 'fixc-b';

	// Generate a word ID from PairedReadingTaskType
	static getWordId(word: WordMetadata): string {
		const { evaluationSegmentIndex, lineIndex } = word;
		return `${this.WORD_ID_PREFIX}-${evaluationSegmentIndex}-${lineIndex}`;
	}

	// Parse a word ID and return PairedReadingTaskType without text
	static parseWordId(id: string): {
		evaluationSegmentIndex: number;
		lineIndex: number;
	} | null {
		const match = id.match(this.WORD_REGEX);
		if (match) {
			return {
				evaluationSegmentIndex: parseInt(match[1], 10),
				lineIndex: parseInt(match[2], 10)
			};
		}
		return null;
	}

	static getFixCrossAId() {
		return this.FIXCROSS_A_ID;
	}

	static getFixCrossBId() {
		return this.FIXCROSS_B_ID;
	}
}

export type WordMetadata = {
	text: string;
	lineIndex: number;
	orderInLine: number;
	isHighlighted: boolean;
	evaluationSegmentIndex: number;
};

export class PairedReadingManager {
	private task: PairedReadingTaskType;
	private _activeEvaluationSegmentIndex: number; // Use underscore for private variables

	constructor(task: PairedReadingTaskType) {
		this.task = task;
		this._activeEvaluationSegmentIndex = 0; // Initially set to the first segment
	}

	// Getter for the active evaluation segment index
	get activeEvaluationSegmentIndex(): number {
		return this._activeEvaluationSegmentIndex;
	}

	// Setter for the active evaluation segment index
	set activeEvaluationSegmentIndex(index: number) {
		if (index >= 0 && index < this.task.evaluationSegment.length) {
			this._activeEvaluationSegmentIndex = index;
		} else {
			throw new Error('Invalid evaluation segment index');
		}
	}

	// Method to get the words formatted as required
	getWords(): WordMetadata[][] {
		const { text, evaluationSegment } = this.task;
		const currentSegment = evaluationSegment[this._activeEvaluationSegmentIndex];
		const [[startLine, startWord], [endLine, endWord]] = currentSegment.range;

		const result: WordMetadata[][] = [];

		// Loop through lines and words, adding metadata
		for (let lineIndex = 0; lineIndex < text.length; lineIndex++) {
			const wordsInLine = text[lineIndex];
			const formattedLine: WordMetadata[] = [];

			for (let wordIndex = 0; wordIndex < wordsInLine.length; wordIndex++) {
				const isHighlighted =
					(lineIndex > startLine || (lineIndex === startLine && wordIndex >= startWord)) &&
					(lineIndex < endLine || (lineIndex === endLine && wordIndex <= endWord));

				formattedLine.push({
					text: wordsInLine[wordIndex],
					lineIndex,
					orderInLine: wordIndex,
					isHighlighted,
					evaluationSegmentIndex: this._activeEvaluationSegmentIndex
				});
			}

			result.push(formattedLine);
		}

		return result;
	}
}
