/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object
var psiTurk = PsiTurk(uniqueId, adServerLoc);

/*var mycondition = condition;  // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which */

//var condition = _.sample([1,2]); // 1 = Low Initial Accuracy; 2 = High Initial Accuracy
var mycondition = condition;  // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
var condition_name = "";
if (condition==="0") {condition_name = "Low Initial Accuracy" } else {condition_name = "High Initial Accuracy"}
console.log(condition)
console.log(condition_name)

var num_words_studied = 18;
var list_repetitions = 3;
var time_per_stimulus = 500; // PLaceholder
var total_time = num_words_studied*list_repetitions*(time_per_stimulus+500)/1000;
console.log("study period duration: "+total_time); // now +500 ms
// 2.5s per item + 500ms ISI per item should take 216 (3.6 min - 3:36) for 18 items

var IMG_DIR = "static/images/objects/";
var IMAGE_FILES = [];

for (var i = 1; i <= 72; i++) {
		IMAGE_FILES.push(IMG_DIR+i+".jpg");
}

// All pages to be loaded
var pages = [
	"instructions/instruct-1.html",
	"instructions/instruct-quiz.html",
	"instructions/instruct-famil.html",
	"instructions/instruct-study.html",
	"instructions/instruct-test.html",
	"stage.html",
	"postquestionnaire.html"
];

psiTurk.preloadImages(IMAGE_FILES);

psiTurk.preloadPages(pages);

var instructionPages = [
	"instructions/instruct-1.html",
	"instructions/instruct-quiz.html",
	"instructions/instruct-famil.html"
];

var studyInstructions = [
	"instructions/instruct-study.html"
];

var testInstructions = [
	"instructions/instruct-test.html"
];

var stage = [
"stage.html"
];
var database = new Firebase('https://initial-accuracy1.firebaseio.com/');
var dbfamil = database.child("familiarization");
var dbstudy = database.child("study"); // store data from each phase separately
var dbtest = database.child("test");
var dbinstructq = database.child("instructquiz");
var dbpostq = database.child("postquiz");
// callback to let us know when a new message is added: database.on('child_added', function(snapshot) {
//	var msg = snapshot.val();
//	doSomething(msg.name, msg.text);
// });

/********************
* HTML manipulation
*
* All HTML files in the templates directory are requested
* from the server when the PsiTurk object is created above. We
* need code to get those pages from the PsiTurk object and
* insert them into the document.
*
********************/

var instructioncheck = function() {
	var corr = [0,0,0,0];
	if (document.getElementById('icheck1').checked) {corr[0]=1;}
	if (document.getElementById('icheck2').checked) {corr[1]=1;}
	if (document.getElementById('icheck3').checked) {corr[2]=1;}
	if (document.getElementById('icheck4').checked) {corr[3]=1;}
	var checksum = corr.reduce(function(tot,num){ return tot+num }, 0);
	console.log('instructquiz num_correct: ' + checksum);
	psiTurk.recordTrialData({'phase':'instructquiz', 'status':'submit', 'num_correct':checksum});
	var timestamp = new Date().getTime();
	dat = {'uniqueId':uniqueId, 'condnum':mycondition, 'phase':'instructquiz', 'num_correct':checksum, 'time':timestamp};
	dbinstructq.push(dat);

	if (checksum===4){
		document.getElementById("checkquiz").style.display = "none"; // hide the submit button
		document.getElementById("instructquizcorrect").style.display = "inline"; // show the next button
	} else {
		alert('You have answered some of the questions wrong. Please re-read instructions and try again.');
	}
}


var Familiarization = function() {


	var ISI = 1000;
	var time_per_stimulus = 3000;
	var wordon, // time word is presented
	    listening = false;

	var VERBAL_STIM = ["gasser", "coro", "plib", "bosa", "habble", "pumbi", "kaki", "regli", "permi",
		"gaso", "toma", "setar", "temi", "menick", "gosten", "fema", "gheck", "lanty", "ragol", "gelom",
		"feek", "rery", "galad", "bofe", "prino", "lano", "detee", "grup", "heca", "spati", "gidi", "pid",
		"bispit", "ceff", "netu", "mapoo", "colat", "patost", "rofe", "fofi", "molick", "spiczan", "slovy",
		"manu", "poda", "dorf", "vindi", "kupe", "nibo", "wug", "badu", "amma", "ghettle", "kala", "belmi",
		"lurf", "blug", "poove", "spret", "hoft", "prew", "nicote", "sanny", "jeba", "embo", "fexo", "woby",
		"dilla", "arly", "zear", "luli", "grum"]; // 72 words -- not matched to voiced stimuli

	var wordOrder =[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];
	var objOrder = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17];
	var images = _.range(1,72);

	objs = _.shuffle(images);
	words = _.shuffle(VERBAL_STIM);

	var stimuli = [];
	for(i = 0; i<num_words_studied; i++) {
		var iW = wordOrder[i];
		var iO = objOrder[i];
		stimuli.push({"word":words[iW], "obj":objs[iO], "index":[]});
	};

	var famil_lexicon = stimuli.slice();

	var go_on  = function() {

		var hiawordOrder =  [5,4,3,2,1,0,6,7,8,9,10,11,12,13,14,15,16,17]; // Remapped 6

		var liawordOrder =  [11,10,9,8,7,6,5,4,3,2,1,0,12,13,14,15,16,17]; // Remapped 12
		var studystim = [];
		if(condition==="0"){ // Low IA condition
			console.log("low ia")
			for(i = 0; i<num_words_studied; i++) {
				var iW = liawordOrder[i];
				var iO = objOrder[i];
				var init_acc;
				var init_word;
				var init_word_ind;
				if(wordOrder[i]===iW) {
					init_acc = true;
					init_word = words[iW];
					init_word_ind = iW;
				} else {
					init_acc = false;
					init_word = famil_lexicon[i].word;
					init_word_ind = wordOrder[i];
				}


				studystim.push({"word_ind":iW, "obj_ind":iO, "word":words[iW], "obj":objs[iO], "index":[],
					"init_acc":init_acc, "init_word":init_word, "init_word_ind":init_word_ind});
			}
		}
		else { // High IA condition
			console.log("high ia")
			for(i = 0; i<18; i++) {

			var iW = hiawordOrder[i];
			var iO = objOrder[i];
			var init_acc;
			var init_word;
			var init_word_ind;
				if(wordOrder[i]===iW) {
					init_acc = true;
					init_word = words[iW]
					init_word_ind = iW;
				} else {
					init_acc = false;
					init_word = famil_lexicon[i].word;
					init_word_ind = wordOrder[i];
				}
			studystim.push({"word_ind":iW, "obj_ind":iO, "word":words[iW], "obj":objs[iO], "studied":list_repetitions, "index":[],
			  "init_acc":init_acc, "init_word":init_word, "init_word_ind":init_word_ind});

				}

			}


		var true_lexicon = stimuli.slice();
		var blocks = [2,3];

		psiTurk.doInstructions(
    	studyInstructions, // a list of pages you want to display in sequence
    	function() { currentview = new Study(studystim, true_lexicon, blocks, wordon, words, objs); }
    	);

	};

	var next = function() {
		if (stimuli.length===0) {
			console.log("famil phase done")
			go_on();

		}
		else {
			var stim = [stimuli.shift()];
			var time;
				time = time_per_stimulus;

			wordon = new Date().getTime();

			show_stim( stim, time, wordon );
			}
	};


	var record_famil_trial = function(stim, time, wordon) {
		for(var i = 0; i < stim.length; i++) {
			var dat = {'uniqueId':uniqueId, 'condition':condition_name, 'phase':"Familiarization", 'index':stim[i].index,
				'word':stim[i].word, 'obj':stim[i].obj, 'duration':time, 'timestamp':wordon};
			//console.log(dat);
			psiTurk.recordTrialData(dat);
			console.log("record")
			dbfamil.push(dat);
		}
	};

	var show_stim = function(stim, time, wordon) {
		var recorded_flag = false;


		console.log(stim);
		var svg = d3.select("#visual_stim")
			.append("svg")
			.attr("width",480)
			.attr("height",250);


		svg.selectAll("image")
			.data(stim)
			.enter()
			.append("image")
      		.attr("xlink:href", function(d,i) { return IMG_DIR+d.obj+".jpg"; })
      		//.attr("x", function(d,i) { return i*220+60 })
      		.attr("x", 200)
      		.attr("y", 10)
      		.attr("width",120)
      		.attr("height",120)
      		.style("opacity",1);

		svg.selectAll("text")
			.data(stim)
			.enter()
			.append("text")
			//.attr("x", function(d,i) { return i*220+50; })
			.attr("x", 200)
			.attr("y",180)
			.style("fill",'black')
			.style("text-align","center")
			.style("font-size","50px")
			.style("font-weight","200")
			.style("margin","20px")
			.text(function(d,i) { return d.word; });

		setTimeout(function() {
			if(!recorded_flag) { // record once if no keys were pressed
				record_famil_trial(stim, time, wordon);
			}
			remove_stim();
			setTimeout(function(){ next(); }, ISI); // 500ms ISI
		}, time); // time or time+ISI; ?
	};

	var remove_stim = function() {
		d3.select("svg").remove();
		// d3 transitions default to 250ms, and we probably don't want that fade..
		// d3.select("svg")
		// 	.transition()
		// 	.style("opacity", 0)
		// 	.remove();
	};

	// Load the stage.html snippet into the body of the page
	psiTurk.showPage('stage.html');
	// Start the test
	next();
};

var Study = function(studystim, true_lexicon, blocks, wordon, words, objs) {
	console.log("study")
	console.log(studystim)
	var ISI = 1000;
	var time_per_stimulus = 6000;
	studystim = _.shuffle(studystim)

	var finish = function() {

	    // add a novel word/object pair for testing?
	    true_lexicon.push({"word":words[words.length-1], "obj":objs[objs.length-1], "studied":0, "init_word":"NA",
	     "init_acc":"NA","word_ind":words.length-1, "obj_ind":objs.length-1, "init_word_ind":"NA"})
	    true_lexicon = _.shuffle(true_lexicon)
	    psiTurk.doInstructions(
    		testInstructions, // a list of pages you want to display in sequence
    		function() { currentview = new Test(true_lexicon); } // what you want to do when you are done with instructions
    	);
	};


	var record_study_trial = function(stim, time, wordon) {
		for(var i = 0; i < stim.length; i++) {
			var dat = {'uniqueId':uniqueId, 'condition':condition_name, 'phase':"Study", 'index':stim[i].index,
				'word':stim[i].word, 'obj':stim[i].obj, 'duration':time, 'timestamp':wordon};
			//console.log(dat);
			psiTurk.recordTrialData(dat);
			dbstudy.push(dat);
		}
	};

	var next = function() {
		if (studystim.length===0) {
			if (blocks.length!==0) {

				studystim = true_lexicon.slice()
				blocks.shift();
				Study(studystim, true_lexicon, blocks, wordon, words, objs);
			}
			else {
				finish();

				}

		}
		else {
			var stim = [studystim.shift()];
			var time;
				stim.push(studystim.shift());
				time = time_per_stimulus;

			wordon = new Date().getTime();

			show_stim(stim, time, wordon );
			}
	};


	var show_stim = function(stim, time, wordon) {
		var recorded_flag = false;
		//stim = _.shuffle(stim)

		var svg = d3.select("#visual_stim")
			.append("svg")
			.attr("width",480)
			.attr("height",300);


		svg.selectAll("image")
			.data(stim)
			.enter()
			.append("image")
      		.attr("xlink:href", function(d,i) { return IMG_DIR+d.obj+".jpg"; })
      		.attr("x", function(d,i) { return i*300+60 })
      		.attr("y", 10)
      		.attr("width",120)
      		.attr("height",120)
      		.style("opacity",1);

		svg.selectAll("text")
			.data(stim)
			.enter()
			.append("text")
			.attr("y", function(d,i) { return i*60+200 })
			.attr("x",180)
			.style("fill",'black')
			.style("text-align","center")
			.style("font-size","50px")
			.style("font-weight","200")
			.style("margin","20px")
			.text(function(d,i) { return d.word; });

		setTimeout(function() {
			if(!recorded_flag) { // record once if no keys were pressed
				record_study_trial(stim, time, wordon, -1);
			}
			remove_stim();
			setTimeout(function(){ next(); }, ISI); // 500ms ISI
		}, time); // time or time+ISI; ?
	};


	var remove_stim = function() {
		d3.select("svg").remove();
		// d3 transitions default to 250ms, and we probably don't want that fade..
		// d3.select("svg")
		// 	.transition()
		// 	.style("opacity", 0)
		// 	.remove();
	};


		psiTurk.showPage('stage.html');
		next();

};

var Test = function(true_lexicon) {
	// shuffle the words and present each one along with all of the objects
	// prompt them: "Choose the best object for"  (later: try choosing top two or three? or choose until correct?)

	teststim = _.shuffle(true_lexicon); // shuffle...again
	var all_objs = true_lexicon.slice(0);
	all_objs = _.shuffle(all_objs); // and shuffle the object array
	console.log(true_lexicon)
	var finish = function() {
	    //$("body").unbind("keydown", response_handler); // Unbind keys
	    currentview = new Questionnaire();
	};

	console.log(true_lexicon)
	var next = function() {
		if (true_lexicon.length===0) {
			finish();
		}
		else {
			var stim = true_lexicon.shift(); // remove words as tested
			show_test( stim, all_objs );
		}
	};

	var show_test = function(stim, all_objs) {
		console.log(stim)
		wordon = new Date().getTime();
		//console.log(all_objs);
		d3.select("#prompt").html('<h1>Click on the '+ stim.word +'</h1>');

		var rectGrid = d3.layout.grid()
    		.bands()
    		.nodeSize([100, 100])
    		.padding([20, 20]); // padding is absolute if nodeSize is used
    		// .size([100,100])

    	var objs = d3.select("#visual_stim").append("svg")
			.attr({
				width: 900,
				height: 620
			})
			.attr("id", "objArray")
			.append("g")
			.attr("transform", "translate(30,0)");

		var rect = objs.selectAll(".rect")
			.data(rectGrid(all_objs));

		//console.log(rect);

		rect.enter().append("image")
			.attr("xlink:href", function(d) { return IMG_DIR+d.obj+".jpg"; })
			.attr("class", "rect")
			.attr("id", function(d) { return d.obj; })
			.attr("width", rectGrid.nodeSize()[0])
			.attr("height", rectGrid.nodeSize()[1])
			.attr("transform", function(d) { return "translate(" + (d.x + 20)+ "," + d.y + ")"; })
			.style("opacity", 1)
			.on("mousedown", function(d,i) {
				if(stim.obj===d.obj) {
					var correct = 1;
				} else {
					var correct = 0;
				}
				var rt = new Date().getTime() - wordon;
				// want stim.init_acc = True / False
				var dat = {'condition':condition_name, 'phase':"TEST", 'word':stim.word, 'correctAns':stim.obj, 'init_acc':stim.init_acc,
				 'init_word':stim.init_word, "word_ind":stim.word_ind, "corr_obj_ind":stim.obj_ind, "init_word_ind":stim.init_word_ind,
					'response':d.obj, 'correct':correct, 'rt':rt}; // 'studyIndices':stim.studyIndices -- somehow record study...
				//console.log(dat);
				psiTurk.recordTrialData(dat);
				dat.uniqueId = uniqueId;
				dat.timestamp = wordon;
				dbtest.push(dat);
				remove_stim();
				setTimeout(function(){ next(); }, 500); // always 500 ISI
			});

	};

	//var record_test_trial = function() { }

	var remove_stim = function() {
		d3.select("svg").remove();
	};

	psiTurk.showPage('stage.html');
	next();
};


function getRandomSubarray(arr, size) {
    var shuffled = arr.slice(0), i = arr.length, temp, index;
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, size);
}


/****************
* Questionnaire *
****************/

var Questionnaire = function() {
	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	record_responses = function() {
		psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'submit'});
		dat = {'uniqueId':uniqueId, 'condition':condition_name, 'phase':'postquestionnaire'};
		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
			dat[this.id] = this.value;
		});
		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
			dat[this.id] = this.value;
		});
		dbpostq.push(dat);
	};

	prompt_resubmit = function() {
		document.body.innerHTML = error_message; // d3.select("body")
		$("#resubmit").click(resubmit);
	};

	resubmit = function() {
		document.body.innerHTML = "<h1>Trying to resubmit...</h1>";
		reprompt = setTimeout(prompt_resubmit, 10000);

		psiTurk.saveData({
			success: function() {
			    clearInterval(reprompt);
                //psiTurk.computeBonus('compute_bonus', function(){}); // was finish()
								psiTurk.completeHIT();
			},
			error: prompt_resubmit
		});
	};


	// Load the questionnaire snippet
	psiTurk.showPage('postquestionnaire.html');
	psiTurk.recordTrialData({'phase':'postquestionnaire', 'status':'begin'});

	$("#next").click(function () {
	    record_responses();
	    psiTurk.saveData({
            success: function(){
                //psiTurk.computeBonus('compute_bonus', function() {
						    psiTurk.completeHIT();
            },
            error: prompt_resubmit});
	});

};

// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Task
 ******************/
$(window).load( function(){
    psiTurk.doInstructions(
    	instructionPages, // a list of pages you want to display in sequence
    	function() { currentview = new Familiarization(); } // what you want to do when you are done with instructions
    );
});
