<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import { login, register } from '$lib/api/auth';
	import { ApiError } from '$lib/api/client';

	// Check if session expired (from URL params)
	const sessionExpired = $derived($page.url.searchParams.get('expired') === 'true');
	const returnUrl = $derived($page.url.searchParams.get('returnUrl'));

	// Login form state
	let loginUsername = $state('');
	let loginPassword = $state('');
	let loginError = $state('');
	let loginLoading = $state(false);
	let showLoginPassword = $state(false);

	// Register form state
	let registerUsername = $state('');
	let registerPassword = $state('');
	let registerConfirmPassword = $state('');
	let registerFirstName = $state('');
	let registerLastName = $state('');
	let registerEmail = $state('');
	let registerError = $state('');
	let registerLoading = $state(false);
	let showRegisterPassword = $state(false);
	let showRegisterConfirmPassword = $state(false);

	// Success message state
	let registerSuccess = $state(false);
	let activeTab = $state('login');

	async function handleLogin() {
		loginError = '';

		if (!loginUsername || !loginPassword) {
			loginError = 'Prosím, vyplňte všechna pole.';
			return;
		}

		loginLoading = true;
		try {
			await login({ username: loginUsername, password: loginPassword });
			// Redirect to return URL if provided, otherwise home
			if (returnUrl) {
				window.location.href = decodeURIComponent(returnUrl);
			} else {
				goto(resolve('/'));
			}
		} catch (err) {
			if (err instanceof ApiError && err.status === 401) {
				loginError = 'Neplatné uživatelské jméno nebo heslo.';
			}
			else if (err instanceof ApiError && err.status === 403) {
				loginError = 'Váš účet není aktivní. Kontaktujte administrátora.';
			}
			else {
				loginError = 'Chyba serveru. Zkuste to prosím znovu.';
			}
			console.error('Login error:', err);
		} finally {
			loginLoading = false;
		}
	}

	async function handleRegister() {
		registerError = '';

		if (!registerUsername || !registerPassword || !registerFirstName || !registerLastName) {
			registerError = 'Prosím, vyplňte všechna povinná pole.';
			return;
		}

		if (registerPassword !== registerConfirmPassword) {
			registerError = 'Hesla se neshodují.';
			return;
		}

		if (registerUsername.length < 3) {
			registerError = 'Uživatelské jméno musí mít alespoň 3 znaky.';
			return;
		}

		if (registerPassword.length < 6) {
			registerError = 'Heslo musí mít alespoň 6 znaků.';
			return;
		}

		registerLoading = true;
		try {
			await register({
				username: registerUsername,
				password: registerPassword,
				email: registerEmail || '',
				firstName: registerFirstName,
				lastName: registerLastName
			});
			registerSuccess = true;
			activeTab = 'login';
			// Clear form
			registerUsername = '';
			registerPassword = '';
			registerConfirmPassword = '';
			registerFirstName = '';
			registerLastName = '';
			registerEmail = '';
		} catch (err) {
			if (err instanceof ApiError) {
				registerError = 'Registrace se nezdařila. Zkuste to prosím znovu.';
			} else {
				registerError = 'Chyba serveru. Zkuste to prosím znovu.';
			}
			console.error('Registration error:', err);
		} finally {
			registerLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Login - Develex Tasks</title>
	<meta name="description" content="Login page for Develex Tasks" />
</svelte:head>

<section class="mt-8 flex flex-col items-center justify-center px-4">
	<h1 class="text-5xl font-bold text-red-400">Develex Tasks</h1>

	<div class="mt-12 w-full max-w-md">
		<Tabs.Root bind:value={activeTab} class="w-full">
			<Tabs.List class="grid w-full grid-cols-2">
				<Tabs.Trigger value="login">Přihlásit se</Tabs.Trigger>
				<Tabs.Trigger value="register">Zaregistrovat se</Tabs.Trigger>
			</Tabs.List>

			<Tabs.Content value="login">
				<Card.Root>
					<Card.Header>
						<Card.Title>Přihlásit se</Card.Title>
					</Card.Header>
					<Card.Content>
						{#if sessionExpired}
							<p class="mb-4 rounded-md bg-orange-100 p-3 text-sm text-orange-700">
								Vaše relace vypršela. Přihlaste se prosím znovu.
							</p>
						{/if}
						{#if registerSuccess}
							<p class="mb-4 text-sm text-yellow-600">
								Registrace byla úspěšná! Vyčkejte na aktivaci účtu administrátorem.
							</p>
						{/if}
						<form
							onsubmit={(e) => {
								e.preventDefault();
								handleLogin();
							}}
							class="flex flex-col gap-4"
						>
							<div class="flex flex-col gap-2">
								<Label for="login-username">Uživatelské jméno</Label>
								<Input
									id="login-username"
									type="text"
									placeholder="Zadejte uživatelské jméno"
									bind:value={loginUsername}
									autocomplete="username"
								/>
							</div>
							<div class="flex flex-col gap-2">
								<Label for="login-password">Heslo</Label>
								<div class="relative">
									<Input
										id="login-password"
										type={showLoginPassword ? 'text' : 'password'}
										placeholder="Zadejte heslo"
										bind:value={loginPassword}
										autocomplete="current-password"
										class="pr-10"
									/>
									<button
										type="button"
										onclick={() => (showLoginPassword = !showLoginPassword)}
										class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
										aria-label={showLoginPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
									>
										{#if showLoginPassword}
											<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
												<line x1="1" y1="1" x2="23" y2="23"/>
											</svg>
										{:else}
											<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
												<circle cx="12" cy="12" r="3"/>
											</svg>
										{/if}
									</button>
								</div>
							</div>
							{#if loginError}
								<p class="text-sm text-red-500">{loginError}</p>
							{/if}
							<Button
								type="submit"
								class="w-full bg-blue-600 hover:bg-blue-700"
								disabled={loginLoading}
							>
								{loginLoading ? 'Přihlašuji...' : 'Přihlásit se'}
							</Button>
						</form>
					</Card.Content>
				</Card.Root>
			</Tabs.Content>

			<Tabs.Content value="register">
				<Card.Root>
					<Card.Header>
						<Card.Title>Zaregistrovat se</Card.Title>
					</Card.Header>
					<Card.Content>
						<form
							onsubmit={(e) => {
								e.preventDefault();
								handleRegister();
							}}
							class="flex flex-col gap-4"
						>
							<div class="grid grid-cols-2 gap-4">
								<div class="flex flex-col gap-2">
									<Label for="register-firstName"
										>Křestní jméno <span class="text-red-500">*</span></Label
									>
									<Input
										id="register-firstName"
										type="text"
										placeholder="Křestní jméno"
										bind:value={registerFirstName}
										autocomplete="given-name"
									/>
								</div>
								<div class="flex flex-col gap-2">
									<Label for="register-lastName">Příjmení <span class="text-red-500">*</span></Label
									>
									<Input
										id="register-lastName"
										type="text"
										placeholder="Příjmení"
										bind:value={registerLastName}
										autocomplete="family-name"
									/>
								</div>
							</div>
							<div class="flex flex-col gap-2">
								<Label for="register-email">E-mail <small>(dobrovolné)</small></Label>
								<Input
									id="register-email"
									type="email"
									bind:value={registerEmail}
									autocomplete="email"
								/>
							</div>
							<div class="flex flex-col gap-2">
								<Label for="register-username"
									>Uživatelské jméno <span class="text-red-500">*</span></Label
								>
								<Input
									id="register-username"
									type="text"
									placeholder="Zadejte uživatelské jméno"
									bind:value={registerUsername}
									autocomplete="username"
								/>
							</div>
							<div class="flex flex-col gap-2">
								<Label for="register-password">Heslo <span class="text-red-500">*</span></Label>
								<div class="relative">
									<Input
										id="register-password"
										type={showRegisterPassword ? 'text' : 'password'}
										placeholder="Zadejte heslo"
										bind:value={registerPassword}
										autocomplete="new-password"
										class="pr-10"
									/>
									<button
										type="button"
										onclick={() => (showRegisterPassword = !showRegisterPassword)}
										class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
										aria-label={showRegisterPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
									>
										{#if showRegisterPassword}
											<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
												<line x1="1" y1="1" x2="23" y2="23"/>
											</svg>
										{:else}
											<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
												<circle cx="12" cy="12" r="3"/>
											</svg>
										{/if}
									</button>
								</div>
							</div>
							<div class="flex flex-col gap-2">
								<Label for="register-confirmPassword"
									>Potvrďte heslo <span class="text-red-500">*</span></Label
								>
								<div class="relative">
									<Input
										id="register-confirmPassword"
										type={showRegisterConfirmPassword ? 'text' : 'password'}
										placeholder="Zadejte heslo znovu"
										bind:value={registerConfirmPassword}
										autocomplete="new-password"
										class="pr-10"
									/>
									<button
										type="button"
										onclick={() => (showRegisterConfirmPassword = !showRegisterConfirmPassword)}
										class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
										aria-label={showRegisterConfirmPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
									>
										{#if showRegisterConfirmPassword}
											<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
												<line x1="1" y1="1" x2="23" y2="23"/>
											</svg>
										{:else}
											<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
												<circle cx="12" cy="12" r="3"/>
											</svg>
										{/if}
									</button>
								</div>
							</div>
							{#if registerError}
								<p class="text-sm text-red-500">{registerError}</p>
							{/if}
							<Button
								type="submit"
								class="w-full bg-blue-600 hover:bg-blue-700"
								disabled={registerLoading}
							>
								{registerLoading ? 'Registruji...' : 'Zaregistrovat se'}
							</Button>
						</form>
					</Card.Content>
				</Card.Root>
			</Tabs.Content>
		</Tabs.Root>
	</div>

	<div class="absolute bottom-4 left-4">
		<button
			class="rounded-md bg-gray-300 px-3 py-1.5 text-gray-800"
			onclick={() => goto(resolve(`/`))}
		>
			Zpět
		</button>
	</div>
</section>
