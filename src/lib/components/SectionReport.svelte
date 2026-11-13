<script lang="ts">
	import { progress, saveSectionComment } from '#lib/progress.js';
	import ExerciseBridge from './ExerciseBridge.svelte';
	import ReportEditor from './ReportEditor.svelte';

	let { sectionId }: { sectionId: string } = $props();
</script>

<ExerciseBridge title="Help improve this section" size="wide">
	<p>
		Your comment is optional. Tell us what worked, what was difficult, or what we could improve for
		next year's students.
	</p>
	<p>
		Saved comments stay in this browser and are included in your JSON export. You can edit them at
		any time.
	</p>
	<ReportEditor
		saved={$progress.sectionComments[sectionId]?.text}
		save={(text) => saveSectionComment(sectionId, text)}
	/>
</ExerciseBridge>
