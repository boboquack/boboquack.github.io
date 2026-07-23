const words = window.words;
const all_words = new Set(window.all_words);
var today_seed;
var date_string;

function get_front_screen() {
  var now = new Date();
  var day = now.getDate();
  var month = now.getMonth()+1;
  var year = now.getFullYear();
  if(day<10) day = "0"+day;
  if(month<10) month = "0"+month;
  date_string = year+"-"+month+"-"+day;
  today_seed = year*10000+month*100+day;
  return `
<p>
    <b>Daily challenge (`+date_string+`):</b> <button id="start-daily-regular" disabled>Regular mode</button> <button id="start-daily-hard" disabled>Hard mode</button>
</p>
<p>
    <b>Practice:</b> <button id="start-practice-regular" disabled>Regular mode</button> <button id="start-practice-hard" disabled>Hard mode</button>
</p>
  `
}

function enable_play_buttons() {
  document.getElementById("start-daily-regular").disabled = false;
  document.getElementById("start-practice-regular").disabled = false;
  document.getElementById("start-daily-hard").disabled = false;
  document.getElementById("start-practice-hard").disabled = false;
}

function splitmix32(a) {
 return function() {
   a |= 0;
   a = a + 0x9e3779b9 | 0;
   let t = a ^ a >>> 16;
   t = Math.imul(t, 0x21f0aaad);
   t = t ^ t >>> 15;
   t = Math.imul(t, 0x735a2d97);
   return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
  }
}

var prng;
const get_seed = () => (Math.random()*2**32)>>>0;

function random_int(low, high) {
  return Math.floor(prng()*(high-low+1)+low);
}

var sequence;
function choose_words(seed, difficulty) {
  prng = splitmix32(seed);
  sequence = [];
  if(difficulty === REGULAR) {
    for(let i=0;i<6;i++){
      let i1 = random_int(0,words[i].length-1);
      let i2 = i1;
      while(i2 === i1) i2 = random_int(0,words[i].length-1);
      let i3 = i1;
      while(i3 === i1 || i3 === i2) i3 = random_int(0,words[i].length-1);
      sequence.push(words[i][i1]);
      sequence.push(words[i][i2]);
      sequence.push(words[i][i3]);
    }
  }else if(difficulty === HARD) {
    for(let i=0;i<9;i++){
      let i1 = random_int(0,words[i].length-1);
      let i2 = i1;
      while(i2 === i1) i2 = random_int(0,words[i].length-1);
      sequence.push(words[i][i1]);
      sequence.push(words[i][i2]);
    }
  }else throw new Error("invalid difficulty: "+difficulty)
  return sequence;
}

var word_order;
var word_num;
var timeout;
var game_interval;
var results;
var current_spelling;
var attach_letter_button_handlers;
var reenable_letter_buttons;

const TOO_SLOW = -1;
const SKIPPED = 0;
const SOLVED = 1;

const REGULAR = 0;
const HARD = 1;

function diff_to_word(difficulty) {
  if(difficulty === REGULAR) return "Regular";
  if(difficulty === HARD) return "Hard";
  return "???";
}

function make_letter_buttons() {
  let curr_word = word_order[word_num];
  let sorted_word = [];
  for(let i=0; i<curr_word.length; i++) {
    sorted_word.push(curr_word[i].toUpperCase());
  }
  for(let i=0; i<sorted_word.length; i++) {
    for(let j=0; j<sorted_word.length-1; j++) {
      if(sorted_word[j]>sorted_word[j+1]) {
        let tmp = sorted_word[j];
        sorted_word[j] = sorted_word[j+1];
        sorted_word[j+1] = tmp;
      }
    }
  }
  let letters = "";
  let active = [];
  let handlers = [];
  for(let i=0; i<sorted_word.length; i++) {
    letters = letters + `<button id="letter-`+i+`-button" class="letter-button">`+sorted_word[i]+`</button> `;
    active.push(true);
    let handler = () => {
      document.getElementById("letter-"+i+"-button").disabled = true;
      active[i] = false;
      current_spelling += sorted_word[i];
      update_spelling();
    };
    handlers.push(handler);
  }
  
  attach_letter_button_handlers = () => {
    for(let i=0; i<sorted_word.length; i++) {
      document.getElementById("letter-"+i+"-button").addEventListener("click", handlers[i])
    }
  }
  reenable_letter_buttons = () => {
    for(let i=0; i<sorted_word.length; i++) {
      document.getElementById("letter-"+i+"-button").disabled = false;
      active[i] = true;
    }
  }
  handle_letter_press = (c) => {
    for(let i=0; i<sorted_word.length; i++) {
      if(active[i] && c.toUpperCase() === sorted_word[i]) {
        handlers[i]();
        return;
      }
    }
  }
  word_active = true;
  return letters;
}

function get_display() {
  let letters = make_letter_buttons();

  return `
<p><span id="timer" class="timer">00:30</span> - Word <span id="word-num">1</span>/18</p>
<p><span id="letter-buttons">`+letters+`</span></p>
<p><span id="current-spelling" class="spelling">----</span> <button id="clear-word">Clear</button></p>
<p><button id="skip-word" disabled>Skip word</button></p>
<p><span id="spelling-feedback">&nbsp;</span></p>
  `
}

function enable_skip(num) {
  setTimeout(() => {if(word_num === num) document.getElementById("skip-word").disabled = false}, 1_000);
}

function end_game() {
  clearInterval(game_interval);
  load_results();
}

var spelling_feedback_id = 0;
function add_spelling_feedback(feedback) {
  spelling_feedback_id += 1;
  let id = spelling_feedback_id;
  feedback_elt = document.getElementById("spelling-feedback");
  feedback_elt.innerHTML = feedback;
  setTimeout(() => {if(spelling_feedback_id === id) feedback_elt.innerHTML = "&nbsp;"}, 1_000);
}

function validate_spelling() {
  if(all_words.has(current_spelling.toLowerCase())){
    add_spelling_feedback(current_spelling+" is correct!");
    advance_word(SOLVED);
  } else {
    add_spelling_feedback(current_spelling+" is not a valid word.");
    clear_spelling();
  }
}

function update_spelling() {
  let rem_letters = word_order[word_num].length-current_spelling.length;
  document.getElementById("current-spelling").innerHTML = current_spelling + "-".repeat(rem_letters);
  if(rem_letters === 0) validate_spelling();
}

function clear_spelling() {
  current_spelling = "";
  reenable_letter_buttons();
  update_spelling();
}

function advance_word(reason) {
  word_active = false;
  document.getElementById("skip-word").disabled = true;
  results.push(reason);
  word_num+=1;
  if(word_num >= 18) {
    end_game();
    return;
  }
  timeout+=30_000;
  current_spelling = "";
  document.getElementById("word-num").innerHTML = ""+(word_num+1);  
  document.getElementById("letter-buttons").innerHTML = make_letter_buttons();
  update_spelling();
  attach_letter_button_handlers()
  enable_skip(word_num);
}

function load_display() {
  document.getElementById("main").innerHTML = get_display();
  document.getElementById("skip-word").addEventListener("click",() => advance_word(SKIPPED));
  document.getElementById("clear-word").addEventListener("click", clear_spelling);
  attach_letter_button_handlers();
  enable_skip(0);
}

function update_timer() {
  if(Date.now() >= timeout) advance_word(TOO_SLOW);
  if(word_num >= 18) return;
  let rem = Math.max(Math.ceil((timeout-Date.now())/1_000),1);
  let mins = "0"+Math.floor(rem/60);
  let secs = rem%60;
  if(secs<10) secs = "0"+secs;
  let timer_string = mins+":"+secs;
  document.getElementById("timer").innerHTML = timer_string;
}

function run_game() {
  word_num = 0;
  timeout = Date.now() + 30_000;
  results = [];
  current_spelling = "";
  load_display();
  game_interval = setInterval(update_timer,10);
}

var game_type;
function start_daily(difficulty) {
  word_order = choose_words(today_seed*2+difficulty, difficulty);
  game_type = "Daily "+date_string+" | "+diff_to_word(difficulty);
  run_game();
}

function start_practice(difficulty) {
  word_order = choose_words(get_seed(), difficulty);
  game_type = "Practice | "+diff_to_word(difficulty);
  run_game();
}

function add_front_screen_handlers() {
  document.getElementById("start-daily-regular").addEventListener("click", () => start_daily(REGULAR));
  document.getElementById("start-practice-regular").addEventListener("click", () => start_practice(REGULAR));
  document.getElementById("start-daily-hard").addEventListener("click", () => start_daily(HARD));
  document.getElementById("start-practice-hard").addEventListener("click", () => start_practice(HARD));
}

function load_front_screen() {
  document.getElementById("main").innerHTML = get_front_screen();
  add_front_screen_handlers();
  enable_play_buttons();
  window.addEventListener("keydown", handle_keypress);
}

var word_active = false;
var handle_letter_press;
function handle_keypress(e) {
  if (e.repeat || !word_active) return;
  if (e.key === "Backspace") clear_spelling();
  handle_letter_press(e.key);
}

var text_results;
function get_results() {
  let rem = Math.max(Math.floor((timeout-Date.now())/1_000),0);
  let mins = "0"+Math.floor(rem/60);
  let secs = rem%60;
  if(secs<10) secs = "0"+secs;
  let timer_string = mins+":"+secs;
  let rows = ["", "", ""];
  let num_correct = 0;
  for(let i=0; i<18; i+=1) {
    if(results[i]==SOLVED) num_correct += 1;
    let row = Math.floor(i/6);
    var emoji = "❓";
    if(results[i]===SOLVED) emoji = "✅";
    else if(results[i]===TOO_SLOW) emoji = "🐌";
    else if(results[i]===SKIPPED) emoji = "⏩";
    rows[row] += emoji;
  }
  let line=[
    `18 Anagrams | `+game_type,
    num_correct+`/18 words, `+timer_string+` remaining`,
    rows[0],
    rows[1],
    rows[2]
  ]
  text_results = line[0]+'\n'+line[1]+'\n'+line[2]+'\n'+line[3]+'\n'+line[4];
  return `
  <p class="results">`+line[0]+`</p>
  <p class="results">`+line[1]+`</p>
  <p class="results">`+line[2]+`</p>
  <p class="results">`+line[3]+`</p>
  <p class="results">`+line[4]+`</p>
  <p><button id="copy-to-clipboard">Copy to clipboard</button> <class id="copied-text"></class></p>
  `
}

var copied_result_id = 0;
function add_copy_feedback() {
  copied_result_id += 1;
  let id = copied_result_id;
  copied_elt = document.getElementById("copied-text");
  copied_elt.innerHTML = "Copied!";
  setTimeout(() => {if(copied_result_id === id) copied_elt.innerHTML = ""}, 1_000);
}

function copy_to_clipboard() {
  navigator.clipboard.writeText(text_results);
  add_copy_feedback();
}

function add_results_handlers() {
  document.getElementById("copy-to-clipboard").addEventListener("click", copy_to_clipboard);
}

function get_words() {
  text = "Intended words: ";
  for(let i=0;i<18;i+=1) {
    if(i>0) text += ", ";
    text += `<span class="answer">`+word_order[i].toUpperCase()+`</span>`;
  }
  return `<p>`+text+`</p>`
}

function load_results() {
  let middle = get_results();
  let top = get_front_screen();
  let bottom = get_words();
  document.getElementById("main").innerHTML = top + `<br><hr><br>` + middle + `<br>` + bottom;
  add_front_screen_handlers();
  add_results_handlers();
  setTimeout(enable_play_buttons, 1_000);
}

load_front_screen();