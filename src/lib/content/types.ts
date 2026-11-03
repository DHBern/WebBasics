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
};

type QuestionBase = {
	id: string;
	prompt: string;
	feedback?: string;
};

export type MultipleChoiceQuestion = QuestionBase & {
	type: 'multiple-choice';
	options: Option[];
};

export type SortQuestion = QuestionBase & {
	type: 'sort';
	instructions: string;
	items: SortItem[];
	targets: SortTarget[];
	answerKey: Record<string, string>;
};

export type Question = MultipleChoiceQuestion | SortQuestion;

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
	isCorrect: boolean;
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
		type: Question['type'];
		response: {
			selectedOptionIds?: string[];
			placements?: Record<string, string>;
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
		isCorrect: boolean;
	}>;
};

export type SubmissionFile = {
	payload: SubmissionPayload;
	checksum: {
		algorithm: 'SHA-256';
		value: string;
	};
};
