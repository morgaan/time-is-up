(function(window, document, undefined) {
	const TimesUp = (function() {
		let liveRegionElement;
		let currentTurnTeamElement;
		let teamsCountElement;
		let currentRoundElement;
		let roundsCountElement;
		let currentTurnWordsToGuessElement;
		let guessedCountElement;
		let passedCountElement;
		let wordElement;
		let skipButtonElement;
		let timerElement;
		let timerVisualElement;
		let timerRemainingElement;
		let state;
		let timerHandle;
		let timeIsUpSound;
		let skippedSound;
		let guessedSound;
		let stopSound;
		let tickSound = new Audio('data:audio/wav;base64,SUQzAgAAAAAQSlRUMgAABgB0aWNrAFJWQQAACgMQ/////wAAAABDT00AABAAZW5naVR1blBHQVAAMAAAVEVOAAASAGlUdW5lcyAxMi45LjQuOTQAQ09NAABoAGVuZ2lUdW5OT1JNACAwMDAwMDI2MiAwMDAwMDI4NSAwMDAwMDREMyAwMDAwMDUwQiAwMDAwMDAzMCAwMDAwMDAzMCAwMDAwNTE3RCAwMDAwNEQ0NyAwMDAwMDAxOCAwMDAwMDAxOABDT00AAIIAZW5naVR1blNNUEIAIDAwMDAwMDAwIDAwMDAwMjEwIDAwMDAwQUUwIDAwMDAwMDAwMDAwMDEyOTAgMDAwMDAwMDAgMDAwMDAwMDAgMDAwMDAwMDAgMDAwMDAwMDAgMDAwMDAwMDAgMDAwMDAwMDAgMDAwMDAwMDAgMDAwMDAwMDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+5RAAAAAyQa3ge9gkhpg5vA95hJDIBreDWTCSGkC28GcnEkC4CcaCQA5A1BJCfh+n+FeeAAb4AB+Aj+rAXAHBoHICoHA4q+iYWTT2AAD8AAzgA7oe75wWLMQbAp8v2DVzWCAEYRoAQpNbgorwU3wofzMKMZPQHg1U1hDgFdEBolEoIKK6Cm8Cv+UNpSN+SMOQKC4WWCSqwrCkNChJ3oBFqBwgiJkiVhUf1vMPDHNDnE3gYFOSWJpt1ZjRqRjCTYXl9ZAI1kD+LBsLfzJ/eBwiONJnAUFGEGAQWGVUnFchGotIwURiOX1kAHlCQWDYR8uRdFTQRQ8WMBYMmXAx0BBGYifmLOxrK2c2YGKgdakfHbG1////5DtF+XArxMHwkhLENBtgEZlloIOTQXSrHZGBCSLmEv5//mpQwSH5f/63YTsODFfIT1vrbTSQMzZWj2cIDQFppflo1M1Y7D1mkzHQGFhmYkuZrkclSdeIIQ9akJoZm3/mhQD2wvoMaH3C4T/+5RAeoAAkwW3g1gwkhDg1vBrAxIEaBreDekiQKEDW8G9JEgiIEANIAFxUnoWqhKCIJGJ8M/actSAKuXNfmpg1xNxSG2xGADUC+6SSalyIKaBcKP4BC9zK5Ou9n4GOjebVqBKQvuVmTX/////pNHmbAuCcMwQ6V/v5hsafNM01HvPPPPPPt6ILvcuLyytGIpKMLbYwCNCuXWbUcZwmOutnbO37yrw/WZ2u9r8Pw25cXlEOQ+yMv+WnSvgBORAA7KREHPvD79ugsI9jts4XYsRiDOGcM4WEUEV3POwwxUjEHchy9huvT09PT2/p7fdcib/267+P5Y/X6/8MP///edSxK5f386eNv5Dks5Xp43Db/uQ7kspLGGGG5Q/jkP5DnM954YYYYYYYYalEs5//////+GHN4Yc///////9Yc3hhz/ww5vDDn555/+effwqUnM4xSWPz7////+87eeFPTniCnKIFQXwqAkTC/f01ljOct5OzrV8YllJSUlJSUmMBu//+5RA8QADGSg3A2/CYG2FBuBqGEweNg8GFPwAC8s9oEKfgAHu3GIxXdCQModkCnA20QFLGuUrhpiJiLodyMUlCztl8sZGrt4IRp2H5S/VaXPMoS/5hChuz4uI+pdxSzGAIcjDuP5Djvv/D8vuQwwxdixGJrnXW0RBxtM6kYctr8j5Xp6en1K5fb1yVw/blbDGIO5GKTmeeqenz//w3TwxIHTa/fwqRixMRiMWOfuVuWuxlk5+GGH7pORxYRglFrm8OZ16e32pKI3L8/w///////////9YYczpKTD888+4U9vv6/////////PPP8KSksV38hyxHe4AA4EoHAoHAwHA4HA4HA9Bz5qup5ULIM5THkdd0DcZsnxThOgxW0ycNCJixBaIyf1IEQTM0xC4hVN01VmZuLjKREB2D+JuJsG6wZFDFKmrTRTL8+TBoGqB5E6BbMXMwbkPOBO/5E2MzcvpubibGJ0c4gRUHt2ofTqQQRTN3QmZBjUmhzR+IIQAppD/+5RgRIAF65BYbh4gAGqSCv7BHAAM6XFl/BWAAMIAa3uCAADI+3+bpp3sn8ni05ugbIpJInTZf//////Qag1k3L6d0/T+/rSnXRWZE7KJ4mpkYM7rQf6lYXwBYAAAAAAAAAAAAAHRBXlf/zf7ETPSYPD//l0UqX/uYe5jEB0YG6/1c/cwfKHHHhEN/+Z1eRIlTDBOOG//vmZhhRxw801S4mG//9v/2NV5iU7//////+lGYxv///zzsoebHTDSCmtdv98UquwgAAAAAWZIOphGa0EQodFtWJQ6jxiBCPrYc5zkTU1glDuNic93F/B527+Wtq2/Drc47DuJlpJX+vbUwvW2tzm7nOdf/DnR3/DnbXObX7nOc5I83hznf3DnOc2v///lrW////sPdoAFgBgAAAARt3PZXeIkgqGp3jOJTpXVRYl06Yf2CIGgaf9P7fpEXrGgr//lf///+ORgAAACuN5cvFJRTZ5+1yNoD0KxpYf5b+nrZ1T2GATS+erqzM//+5RgEoADIFvRyGxTcDHk+f4EIkwQSRkuoz3rwPcU5NARGTDn0Ko49bNi6Fk1SU4ellRiEekqEzuIECJ856lRFEw9NIHRTeVU3NzjlOHyecrIvo/1NZt0NQm7HHW/9v+c3yaJAEUAMAAAACI/nD/nMopuv+5Sytf9FSv3oapW81RICIoyo0BHkafV68qyRPHdX/+zLIwv5q853mSQVcF6nTRVNm5XTwTlHpJyZPN44q1e6tCth9aMpWRaJSP1tQ1lkVz6zaSkW44swo0rLVhcm1levcXVqdQ5VbxCfbaycrtZYo2YOnz5OqmFZTKqDFrbDEzbtmLW2/azahrj/86t/bP1nX/rX/L2KCoCARU7EOs7O+JXVgrLgAAADUT//UMYxpgwoxSzGftVb3Ikc7zOetY0jn9VveWqqqt//85QMRzWdSItYKgr4w9Bp575ZR7/536cSgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+5RAFYAAAAA3gAAAAAAABvAAAAAAAADeAAAAAAAAG8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+5RAw4AAAAA3gAAAAAAABvAAAAAAAADeAAAAAAAAG8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');

		const version = JSON.parse(window.localStorage.getItem('version'));

		const roundRules = {
			freeSpeech: {
				rule: `L'orateur parle librement et son équipe fait autant de propositions que nécessaire.`,
				passingAllowed: false,
				shuffle: false
			},
			oneWord: {
				rule: `L'orateur n'a le droit qu'à 1 mot et son équipe qu'à 1 proposition.`,
				passingAllowed: true,
				shuffle: true
			},
			mimeAndSounds: {
				rule: `L'orateur n'a le droit qu'aux mimes et aux bruitages et son équipe qu'à 1 proposition.`,
				passingAllowed: true,
				shuffle: true
			}
		};

		// Fisher-Yates shuffle. (https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)
		function shuffle(array) {
			for (let i = array.length - 1; i > 0; i--) {
				let j = Math.floor(Math.random() * (i + 1));
				[array[i], array[j]] = [array[j], array[i]];
			}
		}

		// Temporary until implementation of dialog.
		function resetTimeIsUpSound() {
			tickSound.play();
			tickSound.pause();
			tickSound.currentTime = 0;
			timeIsUpSound.play();
			timeIsUpSound.pause();
			timeIsUpSound.currentTime = 0;
		}

		function createGameDeck(wordsCount) {
			let deck;

			if (version.hasImages) {
				deck = Object.keys(version.dictionary);	
			} else {
				deck = [...version.dictionary];
			}

			shuffle(deck);

			deck = deck.splice(0, wordsCount);

			return deck;
		}

		function initState() {
			const {rounds, timer} = version;
			const teamsCount = Number.parseInt(window.localStorage.getItem('teamsCount'));
			const wordsCount = Number.parseInt(window.localStorage.getItem('wordsCount'));
			const roundsCount = rounds.length;
			const gameDeck = createGameDeck(wordsCount);

			state = {
				roundsCount,
				teamsCount,
				currentWord: gameDeck[0],
				gameDeck,
				wordsToGuess: [...gameDeck],
				hasImages: version.hasImages,
				currentRound: {
					count: 1,
					...roundRules[rounds[0]]
				},
				currentTurn: {
					team: 1,
					wordsGuessed : [],
					wordsPassed : [],
					wordsToGuessCount: gameDeck.length
				},
				timer: {
					end: null,
					remaining: timer,
					max: timer
				}
			};

			const teams = [];

			for (i = 0; i < teamsCount; i++) {
				const pointsPerRound = [];
		
				for (j = 0; j < roundsCount; j++) {
					pointsPerRound.push(0);
				}

				teams.push({
					wordsGuessed: [],
					pointsPerRound
				});
			}

			state.teams = teams;
		}
			
		function init(app) {
			liveRegionElement = document.querySelector('#live-region');
			currentTurnTeamElement = app.querySelector('#currentTurnTeam');
			teamsCountElement = app.querySelector('#teamsCount');
			currentRoundElement = app.querySelector('#currentRound');
			roundsCountElement = app.querySelector('#roundsCount');
			// roundRuleElement = app.querySelector('#roundRule');
			currentTurnWordsToGuessElement = app.querySelector('#currentTurnWordsToGuessedCount');
			guessedCountElement = app.querySelector('#guessedCount');
			passedCountElement = app.querySelector('#passedCount');
			wordElement = app.querySelector('#word');
			skipButtonElement = app.querySelector('#skip');
			stopButtonElement = app.querySelector('#stop');
			timerElement = app.querySelector('#timer');
			timerVisualElement = timerElement.querySelector('#timer-visual');
			timerRemainingElement = timerElement.querySelector('#timer-remaining');
			timeIsUpSound = document.querySelector('#time-is-up-sound');
			skippedSound = document.querySelector('#skipped-sound');
			guessedSound = document.querySelector('#guessed-sound');
			stopSound = document.querySelector('#stop-sound');
			// tickSound = document.querySelector('#tick-sound');

			initState();

			const {
				hasImages,
				currentTurn,
				teams,
				currentRound,
				roundsCount,
				currentWord,
				timer
			} = state;

			currentTurnTeamElement.innerText = currentTurn.team;
			teamsCountElement.innerText = teams.length;
			currentRoundElement.innerText = currentRound.count;
			roundsCountElement.innerText = roundsCount;
			guessedCountElement.innerText = currentTurn.wordsGuessed.length;
			currentTurnWordsToGuessElement.innerText = currentTurn.wordsToGuessCount;
			passedCountElement.innerText = currentTurn.wordsPassed.length;
			timerRemainingElement.innerHTML = `${timer.remaining}&#8239;<span aria-label="seconds">s</span>`

			if (hasImages) {
				const dictionaryEntry = version.dictionary[currentWord];
				const imgElement = document.createElement('img');
				imgElement.id = 'image';
				imgElement.classList.add('c-word__image');
				imgElement.src = `./images/${dictionaryEntry.img}`;
				imgElement.alt = `${currentWord}${currentWord !== dictionaryEntry.desc ? `: ${dictionaryEntry.desc}` : currentWord}`;
				wordElement.appendChild(imgElement);
			}

			if (!currentRound.passingAllowed) {
				skipButtonElement.setAttribute('disabled', true);
			}

			app.removeAttribute('style');
			liveRegionElement.setAttribute('class', 'sr-only');

			startOfRound();

			guessedCountElement.addEventListener('wordGuessed', function updateGuessedCount() {
				const currentGuessedCount = new Number(this.textContent);
				this.textContent = currentGuessedCount + 1;
			});

			passedCountElement.addEventListener('wordPassed', function updatePassedCount() {
				const currentPassedCount = new Number(this.textContent);
				this.textContent = currentPassedCount + 1;
			});

			currentRoundElement.addEventListener('newRound', function updateCurrentRound(event) {
				this.textContent = event.detail.count;
			});

			guessedCountElement.addEventListener('reset', function updateGuessedCount() {
				this.textContent = 0;
			});

			passedCountElement.addEventListener('reset', function updatePassedCount() {
				this.textContent = 0;
			});

			currentTurnWordsToGuessElement.addEventListener('update', function updateCurrentTurnWordsToGuess(event) {
				this.textContent = event.detail.newCount;
			});

			skipButtonElement.addEventListener('newRound', function updatePassButton(event) {
				if (event.detail.passingAllowed) {
					skipButtonElement.removeAttribute('disabled');
					return;
				}
				skipButtonElement.setAttribute('disabled', true);
			});

			wordElement.addEventListener('draw', function updateWordElement(event) {
				const {
					dictionaryEntry,
					newWord
				} = event.detail;

				const imgElement = this.querySelector('#image');

				if (imgElement) {
					imgElement.src = `./images/${dictionaryEntry.img}`;
					imgElement.alt = `${newWord}${newWord !== dictionaryEntry.desc ? `: ${dictionaryEntry.desc}` : newWord}`;
				}
			});

			liveRegionElement.addEventListener('draw', function updateLiveRegionElementWithNextWord(event) {
				const {
					dictionaryEntry,
					newWord
				} = event.detail;

				if (hasImages) {
					this.innerText = `Le nouveau mot est ${newWord}${newWord !== dictionaryEntry.desc ? `, l'image associée contient ${dictionaryEntry.desc}` : ''}`;
				} else {
					this.innerText = `Le nouveau mot est ${newWord}`;
				}
			});

			currentTurnTeamElement.addEventListener('newTeam', function updateTeamCount(event) {
				this.textContent = event.detail.newTeam;
			});

			timerElement.addEventListener('update', function updateTimerElement(event) {
				const remaining = event.detail.remaining;
				const percentage = Math.trunc((remaining * 100)/version.timer);
				timerVisualElement.style.setProperty('--timer-visual-width', `${percentage}%`);
				timerRemainingElement.innerHTML = `${remaining}&#8239;<span aria-label="second${remaining === 1 ? '' : 's'}">s</span>`;
			});
		}

		function countdown() {
			const now = new Date().getTime();
			const {
				timer
			} = state;

			timer.remaining = Math.trunc((timer.end - now)/1000);

			if (timer.remaining < 10 && timer.remaining >= 0) {
				tickSound.currentTime = 0;
				tickSound.play();
			}

			timerElement.dispatchEvent(new CustomEvent('update', {
				detail: {
					remaining: timer.remaining
				}
			}));

			if (timer.remaining <= 0) {
				clearInterval(timerHandle);
				timeIsUpSound.currentTime = 0;
				timeIsUpSound.play();
				endOfTurn();
			}
		}

		function onWordSkipped() {
			skippedSound.currentTime = 0;
			skippedSound.play();

			const {
				currentTurn,
				wordsToGuess
			} = state;
			const guessedWordsCount = currentTurn.wordsGuessed.length;

			wordsToGuess.shift();
			currentTurn.wordsPassed.push(state.currentWord);

			const passedWordsCount = currentTurn.wordsPassed.length;
			const totalPlayed = (guessedWordsCount + passedWordsCount);

			if (totalPlayed <= currentTurn.wordsToGuessCount) {
				passedCountElement.dispatchEvent(new CustomEvent('wordPassed'));
			}
	
			if (totalPlayed < currentTurn.wordsToGuessCount) {
				draw();
			}

			// temporary until dialog is implemented
			resetTimeIsUpSound();

			if (totalPlayed === currentTurn.wordsToGuessCount) {
				endOfTurn();
				return;
			}
		}

		function onWordGuessed() {
			guessedSound.currentTime = 0;
			guessedSound.play();

			const {
				currentTurn,
				wordsToGuess
			} = state;
			const passedWordsCount = currentTurn.wordsPassed.length;

			wordsToGuess.shift();
			currentTurn.wordsGuessed.push(state.currentWord);

			const guessedWordsCount = currentTurn.wordsGuessed.length;
			const totalPlayed = (guessedWordsCount + passedWordsCount);

			if (totalPlayed <= currentTurn.wordsToGuessCount) {
				guessedCountElement.dispatchEvent(new CustomEvent('wordGuessed'));
			}

			if (totalPlayed < currentTurn.wordsToGuessCount) {
				draw();
			}

			// temporary until dialog is implemented
			resetTimeIsUpSound();

			if (totalPlayed === currentTurn.wordsToGuessCount) {
				endOfTurn();
				return;
			}
		}

		function onStopTurn() {
			stopSound.currentTime = 0;
			stopSound.play();

			endOfTurn();
		}

		function draw() {
			const newWord = state.wordsToGuess[0];
			state.currentWord = newWord;

			const drawEvent = new CustomEvent('draw', {
				detail: {
					dictionaryEntry: version.dictionary[newWord],
					newWord
				}
			});

			wordElement.dispatchEvent(drawEvent);
			liveRegionElement.dispatchEvent(drawEvent);
		}

		function endOfTurn() {
			updateTeam();

			const {rounds} = version;
			const {
				wordsToGuess,
				currentRound,
				currentTurn,
				timer
			} = state;


			if (currentTurn.wordsPassed.length > 0) {
				wordsToGuess.push(...currentTurn.wordsPassed);
			}

			state.currentTurn.wordsGuessed = [];
			state.currentTurn.wordsPassed = [];

			if (wordsToGuess.length > 0) {
				const roundName = rounds[currentRound.count-1];
				const roundDetails = roundRules[roundName];

				if (roundDetails.shuffle) {
					shuffle(state.wordsToGuess);
					draw();
				}
				currentTurn.wordsToGuessCount = wordsToGuess.length;
				currentTurnWordsToGuessElement.dispatchEvent(new CustomEvent('update', {
					detail: {
						newCount: wordsToGuess.length
					}
				}));

				alert(`Au tour de l'équipe ${currentTurn.team}`);

				startTimer();
			} else {
				endOfRound();
			}

			timerElement.dispatchEvent(new CustomEvent('update', {
				detail: {
					remaining: timer.max
				}
			}));
			guessedCountElement.dispatchEvent(new CustomEvent('reset'));
			passedCountElement.dispatchEvent(new CustomEvent('reset'));

			currentTurnTeamElement.dispatchEvent(new CustomEvent('newTeam', {
				detail: {
					newTeam: currentTurn.team
				}
			}));
		}


		function startTimer() {
			const {
				timer
			} = state;

			timer.remaining = timer.max;

			const now = new Date().getTime();
			timer.end = now + (timer.remaining * 1000);
			timer.remaining--;

			timerRemainingElement.innerHTML = `${timer.remaining}&#8239;<span aria-label="seconds">s</span>`

			timerHandle = setInterval(countdown, 1000);
		}

		function startOfRound() {
			const {
				currentRound,
			} = state;

			let message = `Début de la manche ${currentRound.count}\n\n`;

			message += `Rappel de la règle:\n${currentRound.rule}\n\n`;
			message += `\nC'est au tour de l'équipe ${state.currentTurn.team}`;

			alert(message);

			startTimer();
		}

		function endOfRound() {
			const {
				currentRound,
				teams,
				roundsCount
			} = state;

			let message = `Fin de la manche ${currentRound.count}\n\n`;

			teams.forEach(function appendEndOfRoundMessage(team, index) {
				const score = team.pointsPerRound[currentRound.count-1];
				message += `L'équipe ${index+1} a marqué ${score} point${score > 1 ? 's' : ''}\n`;
			});

			alert(message);

			if (currentRound.count === roundsCount) {
				endOfGame();
			} else {
				updateRound();
			}
		}

		function endOfGame() {
			const totalScores = computeRanks();

			message = 'Fin de la partie, voici le classement\n\n';

			Object.keys(totalScores).forEach(function appendEndOfGameMessage(team, index) {
				message += `#${index+1} ${team} avec ${totalScores[team]} point${totalScores[team] > 1 ? 's' : ''}\n`
			});

			alert(message);

			location.href = '/index.html';
		}

		function updateRound() {
			const {rounds} = version;
			const {
				currentRound,
				currentTurn
			} = state;

			currentRound.count++;
			const newRoundName = rounds[currentRound.count-1];
			const newRoundDetails = roundRules[newRoundName];
			currentRound.rule = newRoundDetails.rule;
			currentRound.passingAllowed = newRoundDetails.passingAllowed;

			const newRoundEvent = new CustomEvent('newRound', {
				detail: {
					count: currentRound.count,
					...newRoundDetails
				}
			});

			if (currentRound.count !== roundsCount) {
				startOfRound();
			}

			shuffle(state.gameDeck);
			state.wordsToGuess = [...state.gameDeck];

			currentRoundElement.dispatchEvent(newRoundEvent);
			skipButtonElement.dispatchEvent(newRoundEvent);

			guessedCountElement.dispatchEvent(new CustomEvent('reset'));
			currentTurn.wordsToGuessCount = state.wordsToGuess.length;
			currentTurnWordsToGuessElement.dispatchEvent(new CustomEvent('update', {
				detail: {
					newCount: state.wordsToGuess.length
				}
			}));
			draw();
		}

		function updateTeam() {
			const {
				currentRound,
				currentTurn,
				teams
			} = state;
			const roundOfCurrentTeam = teams[currentTurn.team-1];

			roundOfCurrentTeam.pointsPerRound[currentRound.count-1] = roundOfCurrentTeam.pointsPerRound[currentRound.count-1] + currentTurn.wordsGuessed.length;
			roundOfCurrentTeam.wordsGuessed.push(currentTurn.wordsGuessed);

			if (currentTurn.team === teams.length) {
				state.currentTurn.team = 1;
			} else {
				state.currentTurn.team++;
			}
		}

		function computeRanks() {
			const {
				roundsCount,
				teams
			} = state;

			const totalScores = {};

			teams.forEach(function computeEndOfGameScores(team, index) {
				let totalScore = 0;
				for (let i = 0; i < roundsCount; i++) {
					totalScore += team.pointsPerRound[i];
				}
				totalScores[`Equipe ${index+1}`] = totalScore;
			}, {});

			Object.entries(totalScores).sort(function compareScore(a, b) {
				if (a[1] < b[1]) {
					return -1;
				} else if (a[1] > b[1]) {
					return 1;
				}
				return 0;
			});

			return totalScores;
		}

		return {
			init,
			onWordGuessed,
			onWordSkipped,
			onStopTurn
		};
	})();

	const app = document.querySelector('#app');

	TimesUp.init(app);

	app.querySelector('#succeed').addEventListener('click', function succeed(event) {
		event.preventDefault();
		TimesUp.onWordGuessed();
	});

	app.querySelector('#skip').addEventListener('click', function skip(event) {
		event.preventDefault();
		TimesUp.onWordSkipped();
	});

	app.querySelector('#stop').addEventListener('click', function stop(event) {
		event.preventDefault();

		TimesUp.onStopTurn();
	});
})(window, document, undefined);
