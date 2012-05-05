var KEEP_SCORES = 10;

var data = {};
data.chars = " jfkdlsahgyturieowpqbnvmcxz6758493021`-=[]\\;',./ABCDEFGHIJKLMNOPQRSTUVWXYZ~!@#$%^&*()_+{}|:\"<>?";

var save = {};
save.wpms = [];
save.accuracies = [];

var sounds = {};

var words;


$(document).ready(function() {
    sounds = {
        "click": new Audio("click.wav"),
        "clack": new Audio("clack.wav"),
        "ding" : new Audio("ding.wav")
    };
    $.getJSON('wordlist.json', function(jsondata) {
        words = new WeightedList(jsondata);
        next_word();
        //loadData();
        render();
        $(document).keypress(keyHandler);
        $(document).keydown(function(e) {
            if (e.which == 8) { // detect backspace
                data.word_index = Math.max(0,data.word_index - 1);
                data.keys_hit = data.keys_hit.substr(0, data.keys_hit.length - 1);
                if(data.word_errors[data.word_index]) {
                    data.word_errors[data.word_index] = false;
                    data.num_errors -= 1;
                }

                render();
                e.preventDefault();
            }
        });

        /*if (localStorage.data != undefined) {
            load();
            render();
        }
        else {
            set_level(1);
        }*/
    });
});

function generate_word() {
    return words.peek()[0]; // weighted random pick
}

function word_finished() {
    // satisfying ding ---
    if(data.num_errors == 0) {
        sounds["ding"].play();
    }
    // save data from previous word -----
    var accuracy = ((data.word.length - data.num_errors) / data.word.length) * 100; // in percent
    save.accuracies.push([accuracy,data.word.length]);
    if(save.accuracies.length > KEEP_SCORES) save.accuracies.shift();
    // calculate wpm
    var minutes = (new Date().getTime() - data.start_time) / (60.0 * 1000.0);
    var words = data.word.length / 5.0;
    var wpm = words / minutes;
    save.wpms.push([wpm,data.word.length]);
    if(save.wpms.length > KEEP_SCORES) save.wpms.shift();
}

function next_word() {
    data.word = generate_word();
    data.word_index = 0;
    data.keys_hit = "";
    data.num_errors = 0;
    data.word_errors = {};
    data.doneMode = false;
    data.start_time = new Date().getTime();
}


function keyHandler(e) {
    var key = String.fromCharCode(e.which);
    if (data.chars.indexOf(key) < 0){
        return;
    }
    e.preventDefault();
    if(key == " " && data.doneMode) {
        word_finished();
        next_word();
        render();
        return;
    }
    if(data.doneMode) {
        sounds["clack"].play();
        return;
    }
    data.keys_hit += key;
    if(key == data.word[data.word_index]) {
        //data.in_a_row[key] += 1;
        sounds["click"].play();
    }
    else {
        // data.in_a_row[data.word[data.word_index]] = 0;
        // data.in_a_row[key] = 0;
        sounds["clack"].play();
        data.num_errors += 1;
        data.word_errors[data.word_index] = true;
    }
    data.word_index += 1;
    if (data.word_index >= data.word.length) {
        data.doneMode = true;
    }
    render();
    saveData();
}


function saveData() {
    localStorage.data = JSON.stringify(save);
}


function loadData() {
    save = JSON.parse(localStorage.data);
}


function render() {
    //render_level();
    render_word();
    render_info();
    //render_level_bar();
    //render_rigor();
}

function render_word() {
    var word = "";
    for (var i = 0; i < data.word.length; i++) {
        sclass = "normalChar";
        if (i > data.word_index) {
            sclass = "normalChar";
        }
        else if (i == data.word_index) {
            sclass = "currentChar";
        }
        else if(data.word_errors[i]) {
            sclass = "errorChar";
        }
        else {
            sclass = "goodChar";
        }
        word += "<span class='" + sclass + "'>";
        if(data.word[i] == " ") {
            word += "&#9141;"
        }
        else if(data.word[i] == "&") {
            word += "&amp;"
        }
        else {
            word += data.word[i];
        }
        word += "</span>";
    }
    var keys_hit = "<span class='keys-hit'>";
    for(var d in data.keys_hit) {
        if (data.keys_hit[d] == ' ') {
            keys_hit += "&#9141;";
        }
        else if (data.keys_hit[d] == '&') {
            keys_hit += "&amp;";
        }
        else {
            keys_hit += data.keys_hit[d];
        }
    }
    for(var i = data.word_index; i < data.word.length; i++) {
        keys_hit += "&nbsp;";
    }
    keys_hit += "</span>";
    $("#word").html(word + "<br>" + keys_hit);
}

function weighted_average(arr) {
    var sum = 0;
    var weight_total = 0;
    for(var x in arr) {
        var item = arr[x];
        weight_total += item[1];
        sum += item[0] * item[1];
    }
    return sum / weight_total;
}

function render_info() {
    var text = "";

    text += "Recent WPM: " + weighted_average(save.wpms).toPrecision(4) + "&nbsp;"; 
    text += "Recent Accuracy: " + weighted_average(save.accuracies).toPrecision(5) + "%&nbsp;"; 
    $("#info-bar").html(text);
}

/*
function set_level(l) {
    data.in_a_row = {};
    for(var i = 0; i < data.chars.length; i++) {
        data.in_a_row[data.chars[i]] = data.consecutive;
    }
    data.in_a_row[data.chars[l]] = 0;
    data.level = l;
    data.word_index = 0;
    data.word_errors = {};
    data.word = generate_word();
    data.keys_hit = "";
    save();
    render();
}
function level_up() {
    if (data.level + 1 <= data.chars.length - 1) {
        (new Audio('ding.wav')).play();
    }
    l = Math.min(data.level + 1, data.chars.length);
    set_level(l);
}

function render_level() {
    var chars = "<span id='level-chars-wrap'>";
    var level_chars = get_level_chars();
    var training_chars = get_training_chars();
    for (var c in data.chars) {
        if(training_chars.indexOf(data.chars[c]) != -1) {
            chars += "<span style='color: #F00' onclick='set_level(" + c + ");'>"
        }
        else if (level_chars.indexOf(data.chars[c]) != -1) {
            chars += "<span style='color: #000' onclick='set_level(" + c + ");'>"
        }
        else {
            chars += "<span style='color: #AAA' onclick='set_level(" + c + ");'>"
        }
        if (data.chars[c] == ' ') {
            chars += "&#9141;";
        }
        else {
            chars += data.chars[c];
        }
        chars += "</span>";
    }
    chars += "</span>";
    $("#level-chars").html('click to set level: ' + chars);
}

function render_rigor() {
    chars = "<span id='rigor-number' onclick='inc_rigor();'>";
    chars += '' + data.consecutive;
    chars += '<span>';
    $('#rigor').html('click to set required repititions: ' + chars);
}

function inc_rigor() {
    data.consecutive += 1;
    if (data.consecutive > 9) {
        data.consecutive = 2;
    }
    render_rigor();
}


function render_level_bar() {
    training_chars = get_training_chars();
    if(training_chars.length == 0) {
        m = data.consecutive;
    }
    else {
        m = 1e100;
        for(c in training_chars) {
            m = Math.min(data.in_a_row[training_chars[c]], m);
        }
    }
    m = Math.floor($('#level-chars-wrap').innerWidth() * Math.min(1.0, m / data.consecutive));
    $('#next-level').css({'width': '' + m + 'px'});
    
}   


function generate_word() {
    word = '';
    for(var i = 0; i < data.word_length; i++) {
        c = choose(get_training_chars());
        if(c != undefined && c != word[word.length-1]) {
            word += c;
        }
        else {
            word += choose(get_level_chars());
        }
    }
    return word;
}


function get_level_chars() {
    return data.chars.slice(0, data.level + 1).split('');
}

function get_training_chars() {
    var training_chars = [];
    var level_chars = get_level_chars();
    for(var x in level_chars) {
        if (data.in_a_row[level_chars[x]] < data.consecutive) {
            training_chars.push(level_chars[x]);
        }
    }
    return training_chars;
}
*/









































