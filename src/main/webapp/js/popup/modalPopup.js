var modal = document.getElementById("myModal");
var selectedcellData = '';
let columnJsonData;
var span = document.getElementsByClassName("close")[0];
var jsonTextArea = document.getElementById("json-text-area");
var csvTextArea = document.getElementById("csv-text-area");
var okBtn = document.getElementById("okBtn");

function setCellAttributeData(updatedData) {
  var graph = window.editorUiObj.editor.graph;
  var value = graph.getModel().getValue(selectedcellData);
  if (!window.mxUtils.isNode(value)) {
    var doc = window.mxUtils.createXmlDocument();
    var obj = doc.createElement('object');
    obj.setAttribute('label', value || '');
    value = obj;
  }


  value = value.cloneNode(true);
  var removeLabel = false;
  var names = ['jsonData'];
  if(updatedData) {
    for (var i = 0; i < names.length; i++) {
      console.log("========updatedData inside loop",updatedData);
      value.setAttribute(names[i], JSON.stringify(updatedData));
      removeLabel = removeLabel || (names[i] == 'placeholder' &&
        value.getAttribute('placeholders') == '1');
    }
  }
  else {
    // for (var i = 0; i < names.length; i++) {

    //   value.setAttribute(names[i], textArea?.value ? textArea.value : '');
    //   removeLabel = removeLabel || (names[i] == 'placeholder' &&
    //     value.getAttribute('placeholders') == '1');
    // }
  
    // if (removeLabel) {
    //   value.removeAttribute('label');
    // }
    // if(textArea) textArea.value = '';
  }

  graph.getModel().setValue(selectedcellData, value);
  modal.style.display = "none";

}

span.onclick = function () {
  closeModal();
}

window.onclick = function (event) {
  if (event.target == modal) {
    closeModal();
  }
}

function openModal() {
  modal.style.display = "block";
  $('#nextBtn').show();
  $('#okBtn').hide();
  $('#jstree-loader').show();
  $('#jstree').show();
  $('.header-data-wrapper, .json-data-textarea-wrapper').hide();
  callJsTreeAPI();
}

function closeModal() {
  modal.style.display = "none";
}


function triggerModalFromJs(cellData) {
  selectedcellData = cellData;
  openModal();
}

$(document).ready(function() {
  function handleButtonClick(buttonClass, showJsTree, showTextarea) {
    $('.btn-group .btn').removeClass("active");
    $(buttonClass).addClass('active');
    $('#nextBtn').show();
    $('#okBtn').hide();
    $('.header-data-wrapper, .json-data-textarea-wrapper').hide();
    if (showJsTree) {
      $('#jstree-loader').show();
      $('#jstree').show();
      callJsTreeAPI();
    } else {
      $('#jstree').hide();
    }

    if (showTextarea) {
      $('.json-data-textarea-wrapper').show();
    } else {
      $('.json-data-textarea-wrapper').hide();
    }
  }

  function addNewRow() {
    var tbody = $('.table tbody');
    var tr = $('<tr class="border border-bottom"></tr>');
    var tdName = $('<td><div class="column-name"><input type="text" name="cname" id="cname" class="form-control"></div></td>');
    var tdIsVisible = $('<td><input type="checkbox" name="columnCheck" class="form-check-input" checked></td>');
    var tdRename = $('<td><div class="column-name"><input type="text" name="rename" class="form-control"></div></td>');

    tr.append(tdName, tdIsVisible, tdRename);

    tbody.append(tr);
  }

  function getUpdatedJsonData() {
    var updatedJsonData = {};
    var mainKey = Object.keys(columnJsonData)[0];
    // Iterate over the table rows
    $('.table tbody tr').each(function() {
      var checkbox = $(this).find('input[name="columnCheck"]');
      var columnNameInput = $(this).find('input[name="cname"]');
      var renameInput = $(this).find('input[name="rename"]');
      var columnName = columnNameInput.val();
      var isChecked = checkbox.is(':checked');
      var rename = renameInput.val();

      if (isChecked & columnName != '') {
        if (rename && rename.trim() !== '') {
          updatedJsonData[rename] = columnJsonData[mainKey][columnName];
        } else {
          updatedJsonData[columnName] = columnJsonData[mainKey][columnName];
        }
      }
    });
    const data = { [mainKey] : updatedJsonData};
    return data;
  }

  function initializeModal() {
    handleButtonClick('.btn-api', true, false); // Default to API tab
    $('#nextBtn').show();
    $('#okBtn').hide();
    $('.header-data-wrapper').hide();
  }

    initializeModal();

  $('.btn-json').on('click', function() {
    $('#csv-text-area').css('display', 'none');
    $('#json-text-area').css('display', 'flex');

    handleButtonClick('.btn-json', false, true);
  });

  $('.btn-api').on('click', function() {
    handleButtonClick('.btn-api', true, false);
  });

  $('.btn-csv').on('click', function() {
    $('#json-text-area').css('display', 'none');
    $('#csv-text-area').css('display', 'flex');

    handleButtonClick('.btn-csv', false, true);
  });

  $('#nextBtn').on('click', function () {
    var activeButton = $('.btn-group .btn.active');
    console.log("Active button:", activeButton.text());

    // Perform actions based on the active button
    if (activeButton.hasClass('btn-json')) {
      // Actions for JSON
      if(jsonTextArea.value) {
        const isValid = isValidJSON(jsonTextArea.value);
        if(isValid) {
          const data = getKeyWithDataType(JSON.parse(jsonTextArea.value));
          console.log("=========json data",data);
        }
        else {
          alert("=======enter valid json")
        }
      }
    } else if (activeButton.hasClass('btn-api')) {
      if(window.jsTreeDropdownData) {
        var tbody = $('.table tbody');
        $('.table tbody').empty();
      
        $('#jstree').hide();
        $('.json-data-textarea-wrapper').hide();
        $('.header-data-wrapper').show();
        $('#nextBtn').hide(); 
        $('#okBtn').show();
        try {
          columnJsonData = JSON.parse(window.jsTreeDropdownData);
        } catch (e) {
          columnJsonData = {'New' : { [window.jsTreeDropdownData] : 'string'}};
        }
        console.log("========= window.jsTreeDropdownData", window.jsTreeDropdownData);
        console.log("========= columnJsonData", columnJsonData);

        Object.keys(columnJsonData[Object.keys(columnJsonData)[0]]).forEach(function(key) {
          var tr = $('<tr class="border border-bottom"></tr>');
          var tdName = $('<td><div class="column-name"><input type="text" name="cname" id="cname" class="form-control" value="' + key + '"></div></td>');
          var tdIsVisible = $('<td><input type="checkbox" name="columnCheck" class="form-check-input" checked></td>');
          var tdRename = $('<td><div class="column-name"><input type="text" name="rename" class="form-control"></div></td>');
      
          tr.append(tdName, tdIsVisible, tdRename);
      
          tbody.append(tr);
        });

        addNewRow();

        $(document).on('input', 'input[name="cname"]', function() {
          if ($('.table tbody tr:last-child input[name="cname"]').val() !== '') {
            addNewRow();
          }
        });
      }
      else {
        alert("no data selected")
      }
    } else if (activeButton.hasClass('btn-csv')) {
      if(csvTextArea.value) {
        const isValid = isCommaSeparated(csvTextArea.value);
        if(isValid) {
          const data = csvTextArea.value.split(',');
          console.log("========csv data",data);
        }
        else {
          alert("=======enter valid csv")
        }
      }
    }
  });

  $('#okBtn').on('click', function () {
    var updatedData = getUpdatedJsonData();

    console.log("Updated JSON data:", updatedData);
    setCellAttributeData(updatedData);

    window.jsTreeDropdownData = null;

  });

  $('.copy-btn').on('click', function() {
    var textToCopy = $('#output').text();

    var tempTextArea = document.createElement('textarea');
    tempTextArea.value = textToCopy;
    document.body.appendChild(tempTextArea);

    tempTextArea.select();
    tempTextArea.setSelectionRange(0, 99999);

    document.execCommand('copy');

    document.body.removeChild(tempTextArea);

  });
});

function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

function isCommaSeparated(str) {
  const parts = str.split(',');
  return parts.length > 1;
}

function getKeyWithDataType(obj){
  const result = {};
  function traverseObj(obj, prefix = '') {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const valueType = typeof value;

        if (valueType === 'object' && value !== null && !Array.isArray(value)) {
          traverseObj(value, fullKey);
        }
        else if (Array.isArray(value) && typeof value[0] === 'object') {
          traverseObj(value[0], fullKey);
        }
        else {
          result[fullKey] = valueType === 'object' && value === null ? 'string' : valueType;
        }
      }
    }
  }
  traverseObj(obj);
  return result;
}

function headerTableCreate(data) {
  if(data) {
    var tbody = $('.table tbody');
    $('.table tbody').empty();
  
    $('#jstree').hide();
    $('.json-data-textarea-wrapper').hide();
    $('.header-data-wrapper').show();
    $('#nextBtn').hide(); 
    $('#okBtn').show();
    try {
      columnJsonData = JSON.parse(data);
    } catch (e) {
      columnJsonData = {'New' : { [data] : 'string'}};
    }
    console.log("========= data", data);
    console.log("========= columnJsonData", columnJsonData);

    Object.keys(columnJsonData[Object.keys(columnJsonData)[0]]).forEach(function(key) {
      var tr = $('<tr class="border border-bottom"></tr>');
      var tdName = $('<td><div class="column-name"><input type="text" name="cname" id="cname" class="form-control" value="' + key + '"></div></td>');
      var tdIsVisible = $('<td><input type="checkbox" name="columnCheck" class="form-check-input" checked></td>');
      var tdRename = $('<td><div class="column-name"><input type="text" name="rename" class="form-control"></div></td>');
  
      tr.append(tdName, tdIsVisible, tdRename);
  
      tbody.append(tr);
    });

    addNewRow();

    $(document).on('input', 'input[name="cname"]', function() {
      if ($('.table tbody tr:last-child input[name="cname"]').val() !== '') {
        addNewRow();
      }
    });
  }
  else {
    alert("no data selected")
  }
}