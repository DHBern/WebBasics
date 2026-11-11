export type Option = {
	id: string;
	text: string;
	correct: boolean;
};

export type SortItem = {
	id: string;
	text: string;
};

export type SortTarget = {
	id: string;
	label: string;
	parentId?: string;
	prefix?: string;
	suffix?: string;
};

type QuestionBase = {
	id: string;
	prompt: string;
	feedback?: string | string[];
	bonusId?: string;
};

export type MultipleChoiceQuestion = QuestionBase & {
	type: 'multiple-choice';
	description?: string[];
	options: Option[];
};

export type DragAndDropQuestion = QuestionBase & {
	type: 'drag-n-drop';
	instructions: string | string[];
	items: SortItem[];
	targets: SortTarget[];
	answerKey: Record<string, string>;
};

export type SortQuestion = QuestionBase & {
	type: 'sort';
	instructions: string | string[];
	items: SortItem[];
	targets: SortTarget[];
	answerKey: Record<string, string>;
};

export type InputQuestion = QuestionBase & {
	type: 'input';
	description?: string[];
};

export type PlacementQuestion = DragAndDropQuestion | SortQuestion;
export type Question = MultipleChoiceQuestion | PlacementQuestion | InputQuestion;

export type LessonBlock = {
	id: string;
	title: string;
	type: 'lesson';
	text: string;
};

export type CourseItem = Question | LessonBlock;

export type CourseSection = {
	id: string;
	title: string;
	questions: CourseItem[];
	lesson?: string;
};

export type Strand = {
	id: string;
	title: string;
	description: string;
	sections: CourseSection[];
};

export type SubmittedAnswer = {
	questionId: string;
	revision: string;
	submittedAt: string;
	type: Question['type'];
	selectedOptionIds?: string[];
	placements?: Record<string, string>;
	textResponse?: string;
	bonusResponse?: string;
	bonusSubmittedAt?: string;
	isCorrect: boolean | null;
};

export type SavedProgress = {
	version: 1;
	answers: Record<string, SubmittedAnswer>;
	changeNotices: string[];
};

export type SubmissionPayload = {
	format: 'webbasics-submission';
	formatVersion: 1;
	strandId: string;
	strandTitle: string;
	createdAt: string;
	answers: Array<{
		questionId: string;
		questionRevision: string;
		sectionId: string;
		sectionTitle: string;
		question: string;
		description?: string[];
		type: Question['type'];
		response: {
			selectedOptionIds?: string[];
			placements?: Record<string, string>;
			text?: string;
			submittedAt?: string;
		};
		correctResponse: {
			selectedOptionIds?: string[];
			placements?: Record<string, string>;
		};
		options?: Array<{
			id: string;
			text: string;
			correct: boolean;
			selected: boolean;
		}>;
		items?: Array<{
			id: string;
			text: string;
			correctTargetId: string;
			selectedTargetId: string | null;
			correct: boolean;
		}>;
		bonusResponse?: {
			prompt: string;
			response: string;
			submittedAt: string;
		};
		isCorrect: boolean | null;
	}>;
};

export type SubmissionFile = {
	payload: SubmissionPayload;
	checksum: {
		algorithm: 'SHA-256';
		value: string;
	};
};
