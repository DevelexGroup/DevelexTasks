<script>
	import ButtonStartLesson from '$lib/components/ButtonStartLesson.svelte';
</script>

<div class="flex flex-col items-center justify-center space-y-4">
	<h1 class="text-3xl font-bold">Cibule</h1>
	<p>Choose your level:</p>
	<div class="flex flex-col items-center justify-center space-y-4">
		<ButtonStartLesson href="/lesson/cibule/one">
			Level One - hledání písmen (stejným slajdu)
		</ButtonStartLesson>
		<ButtonStartLesson href="/lesson/cibule/two">
			Level Two - hledání písmen (písmeno zvlášť sladj)
		</ButtonStartLesson>
		<ButtonStartLesson href="/lesson/cibule/three">
			Level Three - hledání slabík (stejný sladj)
		</ButtonStartLesson>
		<ButtonStartLesson href="/lesson/cibule/four">
			Level Four - hledání slabik (slabika zvlášť sladj)
		</ButtonStartLesson>
		<ButtonStartLesson href="/lesson/cibule/five">
			Level Five - najdi ukryté slovo z písmen
		</ButtonStartLesson>
		<ButtonStartLesson href="/lesson/cibule/six">
			Level Six - najdi ukryté slovo (zvýraznění)
		</ButtonStartLesson>
		<ButtonStartLesson href="/lesson/cibule/six">
			Level Seven - najdi ukryté slovo
		</ButtonStartLesson>
	</div>
</div>
