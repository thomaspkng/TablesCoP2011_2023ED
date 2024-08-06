/* JS for checking bending capacity & compressive capacity with Table3, Table8.3x & Table8.8(x) */
// Global variables
let table3_JSON = ""; // loading JSON of table 3.x from function getJsonTable3()
let table8_3_JSON = ""; // loading JSON of table 8.3x from function getJsonTable8_3()
let table8_8_index = ""; // loading list of lambda and table for strut curve from function getIndexTable8_8x()
let table8_8a_JSON = ""; // loading table 8.8(a)
let table8_8b_JSON = ""; // loading table 8.8(b)
let table8_8c_JSON = ""; // loading table 8.8(c)
let table8_8d_JSON = ""; // loading table 8.8(d)
let table8_8e_JSON = ""; // loading table 8.8(e)
let table8_8f_JSON = ""; // loading table 8.8(f)
let table8_8g_JSON = ""; // loading table 8.8(g)
let table8_8h_JSON = ""; // loading table 8.8(h)
let py4chk = 0; // modified design strength according to the thickness from function designStrength()
let lr4chk = 0; // calculated lambda by eff.Len / radGyration from function designStrength()
let lrLT4chk = 0; // lambda x 0.9, as u, v = 1
let lr_lower = 0; // lower-bound of lambda from function lr_bounds()
let lr_upper = 0; // upper-bound of lambda from function lr_bounds()
let lrLT_lower = 0; // lower-bound of lambdaLT from function lrLT_bounds()
let lrLT_upper = 0; // upper-bound of lambdaLT from function lrLT_bounds()
let hfcf4chk = ""; // hotform or coldform selection radio button from function pb_py_bounds()
let pb_py_lower = 0; // lower-bound of py, Table 8.3x
let pb_py_upper = 0; // upper-bound of py, Table 8.3x
let pb_allow = 0; // calculated finalize pb - allowable bending strength
let pc_py_lower = 0; // lower-bound of py, Table 8.8(x)
let pc_py_upper = 0; // upper-bound of py, Table 8.8(x)
let pc_py_case = 0; // checking case of py % pc
let sq_curve = ""; // the index of steelgrade-strutcurve, e.g.: S-a, Q-b
let pc_allow = 0; // calculated finalize pc - allowable compressive strength

// keep Effective Length & Radius of Gyration non-negative
// state inside oninput, no need to async
function nonegative(e_id_now) {
  let e_value_now = document.getElementById(e_id_now).value;
  if (e_value_now < 0) {
  document.getElementById(e_id_now).value = 0;
  }
}

// function for load JSON from file: fn
function loadFile(fn) {
  return new Promise((resolve) => {
  let xhr = new XMLHttpRequest();
  xhr.open('GET',fn);
  xhr.onload = function () {
    if (xhr.status == 200) {
    resolve(this.responseText);
    }
  }
  xhr.send();
  });
}

async function getTables() {
  loadFile('./json/table3.json')
  .then((thisValue)=>{
  table3_JSON = JSON.parse(thisValue);
  })
  .then(
  loadFile('./json/table8_3.json')
  .then((thisValue) => {
  table8_3_JSON = JSON.parse(thisValue);
  })
  ).then(
  loadFile('./json/table8_8a.json')
  .then((thisValue) => {
  table8_8a_JSON = JSON.parse(thisValue);
  })
  ).then(
  loadFile('./json/table8_8b.json')
  .then((thisValue) => {
  table8_8b_JSON = JSON.parse(thisValue);
  })
  ).then(
  loadFile('./json/table8_8c.json')
  .then((thisValue) => {
  table8_8c_JSON = JSON.parse(thisValue);
  })
  ).then(
  loadFile('./json/table8_8d.json')
  .then((thisValue) => {
  table8_8d_JSON = JSON.parse(thisValue);
  })
  ).then(
  loadFile('./json/table8_8e.json')
  .then((thisValue) => {
  table8_8e_JSON = JSON.parse(thisValue);
  })
  ).then(
  loadFile('./json/table8_8f.json')
  .then((thisValue) => {
  table8_8f_JSON = JSON.parse(thisValue);
  })
  ).then(
  loadFile('./json/table8_8g.json')
  .then((thisValue) => {
  table8_8g_JSON = JSON.parse(thisValue);
  })
  ).then(
  loadFile('./json/table8_8h.json')
  .then((thisValue) => {
  table8_8h_JSON = JSON.parse(thisValue);
  })
  ).then(
  loadFile('./json/table8_8x_lr_table.json')
  .then((thisValue) => {
  table8_8_index = JSON.parse(thisValue);
  })
  ).then(() => {
  operations();
  });
}

// reading the check box of steel grade and mmeber thickness to check design strength
function designStrength() {
  let stgd = document.getElementsByName('stgrade');
  let thkn = document.getElementsByName('thkness');
  let pyd = 0;
  let thknList = 0;
  let effLen = document.getElementById('Le').value;
  let rGy = document.getElementById('ry').value;
  for (var i=0;i <stgd.length;i++) { // loop the steel grade
    if (stgd[i].checked) {
      pyd = stgd[i].value;
    }
  }
  for (var i=0;i<thkn.length;i++) { // loop the thickness
  if (thkn[i].checked) {
    thknList = thkn[i].value;
  }
  py4chk = table3_JSON[pyd][thknList];
  }
  document.getElementById('py').value = py4chk;
  if (!(effLen>0 && rGy>0)) {
    document.getElementById('lr_disp').value = "(n.a.)";
    document.getElementById('lrLT_disp').value = "(n.a.)";
    document.getElementById('bendCap').innerHTML = "Slenderness Ratios NOT Set, Calculation NOT Available!!!";
  } else {
    lr4chk = Math.round(effLen/rGy*100)/100;
    lrLT4chk = Math.round(0.9 * lr4chk*100)/100;
    document.getElementById('lr_disp').value = lr4chk;
    document.getElementById('lrLT_disp').value = lrLT4chk;
    pb_py_bounds(); // calculate lower- & upper-bound of design strength py for Table 8.3x
    pc_py_bounds(); // calculate lower- & upper-biund of design strength py for Table 8.8(x)
    lr_bounds(); // calculate lower- & upper-bound of lambda for Table 8.8(x)
    lrLT_bounds(); // calculate lower- & upper-bound of lambdaLT for Table 8.3x
    bendingCapacity(); // calculate allowable bending strength
    compressiveCapacity(); // calculate allowable compressive strength
  }
}

// calculate lower- & upperbound of lambda
function lr_bounds() {
  if (lr4chk<15) { // if lr < 15, set lower- & upper-bound to 15
    lr_lower = 15;
    lr_upper = 15;
    return;
  }
  if (lr4chk>350) { // of lr > 350, set lower- & upper-bound to 400
    lr_lower = 400;
    lr_upper = 400;
    return;
  }
  var lr_list = table8_8_index['lr_list']; // list of lambda of Table 8.8(x)
  var lr_lower_now = 0;
  var lr_upper_now = 0;
  lr_list.forEach(function(evt) { // loop all lr_list to find if lr4chk == lr_list[i]
    if (evt==lr4chk) {
      lr_lower_now = evt;
      lr_upper_now = evt;
    }
  });
  if (lr_lower_now>0 && lr_upper_now>0) { // if lr_now == lr_list, set lower- & upper-bound then return
    lr_lower = lr_lower_now;
    lr_upper = lr_upper_now;
    return;
  }
  for (var i=0;i<lr_list.length-1;i++) {
    if (lr4chk>lr_list[i] && lr4chk<lr_list[i+1]) {
      lr_lower_now = lr_list[i];
      lr_upper_now = lr_list[i+1];
    }
  }
  lr_lower = lr_lower_now;
  lr_upper = lr_upper_now;
}

// calculate lower- & upper-bound of lambdaLT
function lrLT_bounds() {
  if (lrLT4chk<25) { // if lrLT < 25, set lower- & upper-bound to 25
    lrLT_lower = 25;
    lrLT_upper = 25;
    return;
  }
  if (lrLT4chk>250) { // if lrLT > 250, set lower- & upper-bound to 300
    lrLT_lower = 300;
    lrLT_upper = 300;
    return;
  }
  var lrLT_list = table8_3_JSON['lrLT']; // list of lambdaLT of Table 8.3x
  var lrLT_lower_now = 0;
  var lrLT_upper_now = 0;
  lrLT_list.forEach(function(evt) { // loop all lrLT_list to find if lrLT4chk == lrLT_list[i]
    if (evt==lrLT4chk) {
      lrLT_lower_now = evt;
      lrLT_upper_now = evt;
    }
  });
  if (lrLT_lower_now>0 && lrLT_upper_now>0) { // if lrLT_now == lrLT_list, set lower- & upper-bound then return
    lrLT_lower = lrLT_lower_now;
    lrLT_upper = lrLT_upper_now;
    return;
  }
  for (var i=0;i<lrLT_list.length-1;i++) {
    if (lrLT4chk>lrLT_list[i] && lrLT4chk<lrLT_list[i+1]) {
        lrLT_lower_now = lrLT_list[i];
        lrLT_upper_now = lrLT_list[i+1];
    }
  }
  lrLT_lower = lrLT_lower_now;
  lrLT_upper = lrLT_upper_now;
}

// checking lower- & upper- bound of design strength py1 / py2 for py4chk
function pc_py_bounds() {
  // check the steel grade and strut curve to be used
  var stgd_all = document.getElementsByName('stgrade');
  var stgd_now = "";
  stgd_all.forEach(function(evt) {
    if (evt.checked) {
      stgd_now = evt.value;
    }
  });
  var py_now = Number(document.getElementById('py').value); // design strength after thickness checking
  var strutcurve = document.getElementsByName('strutcurve');
  var strutcurve_now = "";
  strutcurve.forEach(function(evt) {
    if (evt.checked) {
      strutcurve_now = evt.value;
    }
  });
  var stgd_curve = stgd_now.substring(0,1) + "-" + strutcurve_now;
  sq_curve = stgd_curve;
  var py_list_now = table8_8_index['py_table'][stgd_curve][stgd_now];
  var minArr = Math.min(...py_list_now);
  var maxArr = Math.max(...py_list_now);
  // check the py_req within table / less than / greater than py_list
  var case_py = 0;
  // 0: initial, 1: py_req==py_list, 2: py_req within py_list range, 3: py_req<py_list[min], 4: py_req>py_list[max]
  py_list_now.forEach(function(evt) {
    if (evt == py_now) {
      case_py = 1;
      pc_py_case = 1;
      pc_py_lower = py_now;
      pc_py_upper = py_now;
    }
  });
  if (!case_py) { // if py_now!=py_list
    for (var i=0;i<py_list_now.length-1;i++) {
      if (py_now > py_list_now[i] && py_now < py_list_now[i+1]) {
        case_py = 2;
        pc_py_case = 2;
        pc_py_lower = py_list_now[i];
        pc_py_upper = py_list_now[i+1];
      }
    }
  }
  if (!case_py) { // if py_now not with in py_list
    if (py_now < minArr) {
      case_py = 3;
      pc_py_case = 3;
      pc_py_lower = py_now;
      pc_py_upper = minArr;
    }
  }
  if (!case_py) {
    if (py_now > maxArr) {
      pc_py_case = 4;
      pc_py_lower = maxArr;
      pc_py_upper = py_now;
    }
  }
}

// checking lower- & upper- bound of design strength py1 / py2 for py4chk
function pb_py_bounds() {
  if (py4chk==0) {
    pb_py_lower = 0;
    pb_py_upper = 0;
    hfcf4chk = 'hfcf';
    return;
  }
  var hfcf_now = document.getElementsByName('formtype');
  var py_lower = 0;
  var py_upper = 0;
  hfcf_now.forEach(function(evt){
    if (evt.checked) {
      hfcf_now = evt.value;
    }
  });
  if (hfcf_now=='hf') {
    var pys = table8_3_JSON['py_hotform']; // array of available py from table 8.3a / 8.3c(i)
    hfcf4chk = 'hf';
  } else {
    var pys = table8_3_JSON['py_coldform']; // array of available py from table 8.3b
    hfcf4chk = 'cf';
  }
  pys.forEach(function(evt) {
    if (evt==py4chk) {
      py_lower = py4chk;
      py_upper = py4chk;
    }
  });
  if (py_lower>0) { // if py_lower> 0, py_lower == py_upper, one value, return 1x pys
    pb_py_lower = py_lower;
    pb_py_upper = py_upper;
    return;
  }
  // py4chk != list, find lower- & upper-bound
  for (var i=0;i<pys.length-1;i++) {
    if(py4chk>pys[i] && py4chk<pys[i+1]) {
      py_lower = pys[i];
      py_upper = pys[i+1];
    }
  }
  if (py_lower==0 && py_upper==0) {
    if (py4chk>=pys[pys.length-1]) {
      py_lower = pys[pys.length-1];
      py_upper = py4chk;
    } else if (py4chk<=pys[0]) {
      py_lower = py4chk;
      py_upper = pys[0];
    }
  }
  pb_py_lower = py_lower;
  pb_py_upper = py_upper;
}

// checking compressive capacity of material
function compressiveCapacity() {
  // alert if pc_py_case == 0
  if (pc_py_case == 0) {
    alert('py case error, compressive check halt!');
    return;
  }
  // get all pc from table
  var index_pyL_lrL = pc_py_lower + '-' + lr_lower;
  var index_pyL_lrU = pc_py_lower + '-' + lr_upper;
  var index_pyU_lrL = pc_py_upper + '-' + lr_lower;
  var index_pyU_lrU = pc_py_upper + '-' + lr_upper;
  switch (table8_8_index['sq_curve'][sq_curve]) {
    case "table8_8a_JSON":
      var table8_x = table8_8a_JSON;
      break;
    case "table8_8b_JSON":
      var table8_x = table8_8b_JSON;
      break;
    case "table8_8c_JSON":
      var table8_x = table8_8c_JSON;
      break;
    case "table8_8d_JSON":
      var table8_x = table8_8d_JSON;
      break;
    case "table8_8e_JSON":
      var table8_x = table8_8e_JSON;
      break;
    case "table8_8f_JSON":
      var table8_x = table8_8f_JSON;
      break;
    case "table8_8g_JSON":
      var table8_x = table8_8g_JSON;
      break;
    case "table8_8h_JSON":
      var table8_x = table8_8h_JSON;
      break;
    default:
      alert('SQ_Curve Error');
      return;
  }
  var pc_pyL_lrL = table8_x[index_pyL_lrL];
  var pc_pyL_lrU = table8_x[index_pyL_lrU];
  var pc_pyU_lrL = table8_x[index_pyU_lrL];
  var pc_pyU_lrU = table8_x[index_pyU_lrU];
  // calculate lrL / lrU for pyL
  if (pc_pyL_lrL==pc_pyL_lrU) {
    pc_pyL = pc_pyL_lrL;
  } else {
    pc_pyL = (lr4chk-lr_lower)/(lr_upper-lr_lower)*(pc_pyL_lrU-pc_pyL_lrL)+pc_pyL_lrL;
  }
  // calculate lrL / lrU for pyU
  if (pc_pyU_lrL==pc_pyU_lrU) {
    pc_pyU = pc_pyU_lrL;
  } else {
    pc_pyU =  (lr4chk-lr_lower)/(lr_upper-lr_lower)*(pc_pyU_lrU-pc_pyU_lrL)+pc_pyU_lrL;
  }
  // calculate pc_allow with pc_py_case
  if (pc_py_case == 1){ // case 1
    if (!(pc_pyL==pc_pyU)) {
      alert('case 1 error');
    }
    pc_allow = pc_pyL;
  }
  if (pc_py_case == 2) { // case 2
    pc_allow = (py4chk-pc_py_lower)/(pc_py_upper-pc_py_lower)*(pc_pyU-pc_pyL)+pc_pyL;
  }
  if (pc_py_case == 3) {
    pc_allow = pc_pyU / pc_py_upper * pc_py_lower;
  }
  if (pc_py_case == 4) {
    pc_allow = (pc_pyL) / pc_py_lower * pc_py_upper;
  }
  pc_allow = Math.round(pc_allow*1000)/1000;
  // generate result for show at div#comopCap
  var stm = `Allowable Compressive Stress, <b>p<sub>c</sub>= ${pc_allow}N/mm<sup>2</sup></b>`;
  document.getElementById('compCap').innerHTML = stm;
}

// checking bending capacity of material
function bendingCapacity() {
  var py_lower = pb_py_lower;
  var py_upper = pb_py_upper;
  var hfcf_now = hfcf4chk;
  // if py_lower==0 && py_upper==0, result = (n.a.) & return
  if (py_lower==0 && py_upper==0) {
    document.getElementById('bendCap').innerHTML = "Design Strength NOT set, Calculation NOT Available!";
    return;
  }
  if (lrLT4chk>250) {
    document.getElementById('bendCap').innerHTML = "Slenderness Ratio too high, Calculation NOT Available!";
    return;
  }
  // get minimum py in table 8.3x with HF/CF selected
  if (hfcf4chk=='hf') {
    var py_min = table8_3_JSON['py_hotform'][0];
    var pb_list = table8_3_JSON['pb_hotform'];
  } else if (hfcf4chk=='cf') {
    var py_min = table8_3_JSON['py_coldform'][0];
    var pb_list = table8_3_JSON['pb_coldform'];
  } else {
    alert('Hot Form / Colde Form Input Error!');
  }
  if (py4chk>=py_min) { // normal case, py within range of strength in table8.3x
    var index_pyL_pbL = py_lower + "-" + lrLT_lower;
    var index_pyL_pbU = py_lower + "-" + lrLT_upper;
    var index_pyU_pbL = py_upper + "-" + lrLT_lower;
    var index_pyU_pbU = py_upper + "-" + lrLT_upper;
    var pyL_pb_lower = pb_list[index_pyL_pbL];
    var pyL_pb_upper = pb_list[index_pyL_pbU];
    var pyU_pb_lower = pb_list[index_pyU_pbL];
    var pyU_pb_upper = pb_list[index_pyU_pbU];
    if (index_pyL_pbL==index_pyU_pbL) { // py-bounds are same
      if (index_pyL_pbL==index_pyL_pbU) { // lrLT-bounds are same
        pb_allow = pyL_pb_lower;
      } else { // py-bounds are same, lrLT-bound diffenert
        pb_allow = Math.round(((lrLT4chk - lrLT_lower)/(lrLT_upper-lrLT_lower)*(pyL_pb_upper-pyL_pb_lower)+pyL_pb_lower)*1000)/1000;
      }
    } else { // py-bounds diffenert
      if (lrLT_lower==lrLT_upper) { // if py-bound different, lrLT are same
        pb_allow = Math.round(((py4chk - py_lower)/(py_upper-py_lower)*(pyU_pb_lower-pyL_pb_lower)+pyL_pb_lower)*1000)/1000;
      } else { // py-bounds, lrLT-bounds -> 4 values
        var pb_allow_lower = (lrLT4chk - lrLT_lower)/(lrLT_upper-lrLT_lower)*(pyL_pb_upper-pyL_pb_lower)+pyL_pb_lower;
        var pb_allow_upper = (lrLT4chk - lrLT_lower)/(lrLT_upper-lrLT_lower)*(pyU_pb_upper-pyU_pb_lower)+pyU_pb_lower;
        pb_allow = Math.round(((py4chk - py_lower)/(py_upper-py_lower)*(pb_allow_upper-pb_allow_lower)+pb_allow_lower)*1000)/1000;
      }
    }
  } else { // py4chk < py_min, only calculate py-upper & lrLT-bounds, set pb_allow with proportion between py_lower & py_upper
    var index_pyU_pbL = py_upper + "-" + lrLT_lower;
    var index_pyU_pbU = py_upper + "-" + lrLT_upper;
    var pyU_pb_lower = pb_list[index_pyU_pbL];
    var pyU_pb_upper = pb_list[index_pyU_pbU];
    if (pyU_pb_lower==pyU_pb_upper) { // lrLT_lower == lrLT_upper
      pb_allow = Math.round(pyU_pb_lower * py_lower / py_upper * 1000) / 1000;
    } else { // lrLT-bounds is different
      pb_allow = Math.round(((lrLT4chk-lrLT_lower)/(lrLT_upper-lrLT_lower)*(pyU_pb_upper-pyU_pb_lower)+pyU_pb_lower)*py_lower/py_upper*1000)/1000;
    }
  }
  // generate result for show at div#bendCap
  var stm = `Allowable Bending Stress, <b>p<sub>b</sub>= ${pb_allow}N/mm<sup>2</sup></b>`;
  document.getElementById('bendCap').innerHTML = stm;
}

// add event listt
function addEL_entryF() {
  const allInputs = document.getElementsByClassName('entryF');
  for (var i = 0; i < allInputs.length; i++) {
    allInputs[i].addEventListener('change', function() {
    designStrength();
    });
  }
}

// functions run after tables loaded
function operations() {
  addEL_entryF(); // add event listener to elements after loaded
  designStrength(); // check designStrength from py and thickness
}

// functions loaded after document.ready
function init() {
  getTables(); // first load all tables to variable and callback operations()
}
