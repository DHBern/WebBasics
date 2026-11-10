import type { SubmissionPayload } from './types.js';

type ItemMetric = {
	id: string;
	text: string;
	attempts: number;
	wrong: number;
	checked: number;
	correctOption: boolean;
};

type RevisionMetric = {
	revision: string;
	sectionTitle: string;
	question: string;
	type: SubmissionPayload['answers'][number]['type'];
	firstExportedAt: string;
	lastExportedAt: string;
	attempts: number;
	wrong: number;
	items: ItemMetric[];
};

export type QuestionMetric = {
	key: string;
	strandId: string;
	questionId: string;
	attempts: number;
	wrong: number;
	versions: RevisionMetric[];
};

export function analyzeSubmissions(payloads: SubmissionPayload[]): QuestionMetric[] {
	const grouped = new Map<string, QuestionMetric>();
	for (const payload of payloads) {
		const exportedAt = new Date(payload.createdAt).toISOString();
		for (const answer of payload.answers) {
			const key = JSON.stringify([payload.strandId, answer.questionId]);
			let metric = grouped.get(key);
			if (!metric) {
				metric = {
					key,
					strandId: payload.strandId,
					questionId: answer.questionId,
					attempts: 0,
					wrong: 0,
					versions: []
				};
				grouped.set(key, metric);
			}
			let version = metric.versions.find(
				(candidate) => candidate.revision === answer.questionRevision && candidate.type === answer.type
			);
			if (!version) {
				version = {
					revision: answer.questionRevision,
					sectionTitle: answer.sectionTitle,
					question: answer.question,
					type: answer.type,
					firstExportedAt: exportedAt,
					lastExportedAt: exportedAt,
					attempts: 0,
					wrong: 0,
					items: []
				};
				metric.versions.push(version);
			}
			if (exportedAt < version.firstExportedAt) version.firstExportedAt = exportedAt;
			if (exportedAt > version.lastExportedAt) version.lastExportedAt = exportedAt;
			metric.attempts++;
			version.attempts++;
			if (!answer.isCorrect) {
				metric.wrong++;
				version.wrong++;
			}

			const itemAnswers = answer.type === 'multiple-choice' ? answer.options : answer.items;
			for (const item of itemAnswers ?? []) {
				let itemMetric = version.items.find((candidate) => candidate.id === item.id);
				if (!itemMetric) {
					itemMetric = {
						id: item.id,
						text: item.text,
						attempts: 0,
						wrong: 0,
						checked: 0,
						correctOption: 'selected' in item && item.correct
					};
					version.items.push(itemMetric);
				}
				itemMetric.attempts++;
				if ('selected' in item) {
					if (item.selected) itemMetric.checked++;
					if (item.correct !== item.selected) itemMetric.wrong++;
				} else if (!item.correct) {
					itemMetric.wrong++;
				}
			}
		}
	}
	for (const metric of grouped.values()) {
		metric.versions.sort(
			(a, b) => b.lastExportedAt.localeCompare(a.lastExportedAt) || a.revision.localeCompare(b.revision)
		);
	}
	return [...grouped.values()];
}
