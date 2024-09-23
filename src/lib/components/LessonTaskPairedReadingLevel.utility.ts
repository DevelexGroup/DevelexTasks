import type { PairedReadingTaskType } from '$lib/types/lesson';

export class PairedReadingIdManager {
	private static WORD_ID_PREFIX = 'fixw';
	private static WORD_REGEX = new RegExp(`^${this.WORD_ID_PREFIX}-(\\d+)-(\\d+)$`);
	private static FIXCROSS_A_ID = 'fixc-a';
	private static FIXCROSS_B_ID = 'fixc-b';

	// Generate a word ID from PairedReadingTaskType
	static getWordId(word: Omit<WordMetadata, 'id'>): string {
		const { evaluationSegments, lineIndex, orderInLine } = word;
		return `${this.WORD_ID_PREFIX}-${JSON.stringify(evaluationSegments)}-${lineIndex}-${orderInLine}`;
	}

	// Parse a word ID and return PairedReadingTaskType without text
	static parseWordId(id: string): {
		evaluationSegmentIndex: number[];
		lineIndex: number;
		orderInLine: number;
	} | null {
		const match = id.match(this.WORD_REGEX);
		if (match) {
			return {
				evaluationSegmentIndex: JSON.parse(match[1]),
				lineIndex: parseInt(match[2]),
				orderInLine: parseInt(match[3])
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
	isInActiveSegment: boolean; // is the word in the active evaluation segment
	evaluationSegments: number[]; // affiliation to evaluation segments, can be multiple
	id: string;
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
		const { text } = this.task;

		const result: WordMetadata[][] = [];

		// Loop through lines and words, adding metadata
		for (let lineIndex = 0; lineIndex < text.length; lineIndex++) {
			const wordsInLine = text[lineIndex];
			const formattedLine: WordMetadata[] = [];

			for (let wordIndex = 0; wordIndex < wordsInLine.length; wordIndex++) {
				// Check in which segment ranges the current word is
				const evaluationSegments = this.task.evaluationSegment
					.map((segment, index) => {
						const [[startLine, startWord], [endLine, endWord]] = segment.range;
						return (lineIndex > startLine || (lineIndex === startLine && wordIndex >= startWord)) &&
							(lineIndex < endLine || (lineIndex === endLine && wordIndex <= endWord))
							? index
							: -1;
					})
					.filter((index) => index !== -1);

				const isInActiveSegment = evaluationSegments.includes(this._activeEvaluationSegmentIndex);

				formattedLine.push({
					text: wordsInLine[wordIndex],
					lineIndex,
					orderInLine: wordIndex,
					isInActiveSegment,
					evaluationSegments,
					id: PairedReadingIdManager.getWordId({
						text: wordsInLine[wordIndex],
						lineIndex,
						orderInLine: wordIndex,
						isInActiveSegment,
						evaluationSegments
					})
				});
			}

			result.push(formattedLine);
		}

		return result;
	}

	getReadingSegment(): {
		id: string;
		text: string;
	} {
		const words = this.getWords();
		const currentSegment = words
			.flatMap((line) => line.filter((word) => word.isInActiveSegment))
			.map((word) => word.text);
		return {
			id: this.task.evaluationSegment[this._activeEvaluationSegmentIndex].id,
			text: currentSegment.join(' ')
		};
	}

	nextSegment(): void {
		if (this._activeEvaluationSegmentIndex < this.task.evaluationSegment.length - 1)
			this.activeEvaluationSegmentIndex++;
	}
}
