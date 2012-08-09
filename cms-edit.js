(function (global) {

  if (!(global.jQuery && global.marked && global.qq && global.cms)) 
    throw new Error('Missing Dependencies: [jQuery, marked, qq, cms]');
  
  var $ = global.jQuery
    , marked = global.marked
    , qq = global.qq
    , cms = global.cms
    , elements = cms.elements;

  //helpers
  function getModal(type) {
    return $('.modal.cms.' + type);
  }

  function save (data) {
    $.ajax({
        type: 'post'
      , url: '/applet/cms'
      , dataType: 'json'
      , data: {data: JSON.stringify(data)}
      , success: function (data) {
        if (!data.success) {
          alert('could not save');
        }
      }
    });
  }
 
  function init() {
    //init modals
    var $save = $('.modal.cms .save');

    $save.click(function (e) {
      e.preventDefault();
      $(this).closest('.modal').trigger('save');
    });

    $('.modal.cms').on('hide', function () {
      $(this).off('save');
    });

    //save on enter for text elemets
    $('.modal.cms.text input').keyup(function (e) {
      if ( e.keyCode === 13) { //enter
        e.preventDefault();
        //trigger save button
        $save.click();
      }
    });
  }

  init();

  /*
   * CMS Elements
   */

  /*
   * Markdown text / textarea
   * Useful for longer text sections
   */
  elements.md.edit = function (el, data) {
    var m = getModal('md')
      , content = data.data;

    m.find('textarea').val(content.md);

    m.one('save', function () {
      content.md = m.find('textarea').val();
      content.text = marked(content.md || ''); //render markdown

      data.data = content;
      el.data('cms', data);
      el.trigger('render');

      save(data);
    });

    m.modal();
    m.find('textarea').focus();
  };
  
  /*
   * Text / Label
   * Useful for titles / subtitles
   */
  elements.text.edit = function (el, data) {
    //Edit dialog
    var m = getModal('text');
    
    m.find('input').attr('value', data.data);
    
    //Its ONE, not on
    m.one('save', function () {
      //bind new data & rerender
      data.data = m.find('input').attr('value');
      if (data.data === '') data.data = '&nbsp;';
      el.data('cms',data);
      el.trigger('render');

      save(data);
    });

    m.modal(); //show it
    m.find('input').focus();
  };

  elements.image.edit = function (el, data) {
    var $m = getModal('image')
      , $hints = $m.find('.hints')
      , sizeLimit = 1024 * 512
      , uploader
      , $save = $m.find('.btn.save')
      , newUrl;

    $save.addClass('disabled');

    uploader = new qq.FileUploader({
        element: $m.find('.upload').get(0)
      , params: { sr: $.ajaxSettings.headers['X-sr'], sizeLimit: sizeLimit }
      , template: '<div class="qq-uploader">' +
            '<div class="span3 btn qq-upload-button">Hochladen</div>' +
            '<ul class="span8 qq-upload-list"></ul>' +
         '</div>'
      , multiple: false
      , action: '/qq.upload' //handled by middleware!
      , debug: false
      , onSubmit: function () { $save.addClass('disabled'); }
      , onComplete: function(id, fileName, json) {
          if (json.success) {
            $save.removeClass('disabled');
            newUrl = json.url;
            //update in the edit modal
            $m.find('img').attr('src', newUrl);
          }
        }
      , messages: {
          sizeError: '{file} ist zu gross. Die maximale Dateigrösse ist {sizeLimit}.'
        }
      , sizeLimit: sizeLimit
    });

    if (!data.hints){
      $hints.hide();
    } else {
      $.each(data.hints, function (key, val) {
        $hints.find('.hint.'+key).html(val);
      });
    }

    $m.find('img').attr('src', data.data);
    
    //save events are unregistered on 'hide'
    $m.on('save', function () {
      if ($save.hasClass('disabled')) return;
      //bind new data & rerender
      data.data = newUrl;
      el.data('cms', data);
      el.trigger('render');
      save(data);
      $m.modal('hide');
    });

    $m.one('hide', function () {
      //cancel ongoing uploads
      uploader._handler.cancelAll();
    });

    $m.modal();
  };
  
  
  elements.button.edit = function (el, data) {
    var $m = getModal('button');
    var $form = $m.find('form');
    var value = data.data;

    $form.find('> .link').show();

    if (typeof value === 'object') {
      // link and text
      $form.find('[name="text"]').val(value.text);
      $form.find('[name="link"]').val(value.link);
      
    } else {
      // assume type string.
      $form.find('[name="text"]').val(value);
      $form.find('> .link').hide();
    }

    $m.one('save', function () {
      if (typeof value === 'object') {
        data.data.text = $form.find('[name="text"]').val();
        data.data.link = $form.find('[name="link"]').val();
      } else {
        data.data = $form.find('[name="text"]').val();
      }
      el.data('cms', data);
      el.trigger('render');
      save(data);
    });

    $m.modal();
    $m.find('input:first').focus();
  };

  elements.form.edit = function (el, data) {
    var $m = getModal('form')
      , $fieldsForm = $m.find('form.fields')
      , $addForm = $m.find('form.addField');

    function addField(name, validators) {

      var $field;

      //field template (only one child, the field itself)
      if (/email/i.test(name)) {
        $field = $m.find('.emailTpl').children().clone();
      } else {
        $field = $m.find('.fieldTpl').children().clone();
      }
      
      $field.find('input[type="text"]')
        .val(name) //not placeholder. ie8 & co. ;-)
        .attr('name', name);

      $field.find('.remove').click(function (e) {
        e.preventDefault();
        $field.remove();
      });

      $field.find('.down').click(function (e) {
        e.preventDefault();
        var $f = $(this).closest('.field');
        $f.next().after($f);
      });

      $.each((validators || []), function (idx, validator) {
        $field.find('.validator[name="' + validator + '"]').attr('checked', true);
      });
      
      $fieldsForm.find('.fields').append($field);
    }

    //defaults
    $fieldsForm.find('.fields').children().remove();

    $.each(data.data, function (idx, field) {
      if (typeof field === 'string') {
        //Legacy
        addField(field.replace(/(^\w)/, function (s, group) { return group.toUpperCase();}));
      } else {
        addField(field.name, field.validators);
      }
    });

    //add field form
    $addForm.submit(function (e) {
      addField($addForm.find('input').val(), ['notEmpty']);
      return false; //prevent default
    });

    $m.one('save', function () {
      var fields = [];

      $fieldsForm.find('.field').each(function () {
        var validators = [];
        $(this).find('.validator:checked').each(function () { validators.push($(this).attr('name'));});
        fields.push({
            name: $(this).find('[type="text"]').val()
          , validators: validators
        });
      });

      data.data = fields;
      el.data('cms', data);
      el.trigger('render');
      save(data);
    });

    $m.one('hide', function () {
      //unregister handlers
      $addForm.off('submit');
    });

    $m.modal();
  };

}(this));
