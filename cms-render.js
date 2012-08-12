(function (global) {

  if (!(global.jQuery && global.cms)) {
    throw new Error('Missing Dependencies: [jQuery, cms]');
  }

  var $ = global.jQuery
    , cms = global.cms
    , elements = cms.elements;

  elements.md.render = function ($el, data) {
    $el.html(data.text);
  };

  elements.text.render = function ($el, data) {
    $el.html(data);
  };

  elements.image.render = function ($el, data) {
    $el.attr('src', data);
  };

  elements.button.render = function ($el, data) {
    if (typeof data === 'string') {
      $el.html(data);
    } else {
      //assume object
      $el.html(data.text);
      $el.attr('href', data.link);
    }
  };

  elements.form.render = function ($el, data) {
    $el.find('> *').hide(); //depth 1
    $.each(data, function (idx, field) {
      if (typeof field === 'string') {
        //Legacy
        $el.find('.' + field).show();
      } else {
        if (idx === 0) $el.find('> *').remove(); //depth 1
        var $field = $('<input type="text"/>')
          .attr('name', field.name)
          .attr('placeholder', field.name)
          .attr('data-validate', JSON.stringify(field.validators));
        
        $el.append($field);
      }
    });
  };

  elements.option.render = function ($el, data) {
    $.each(data.options, function (idx, option) {
      $el.find(option.value).hide();
    });

    $el.find(data.selected).show();
  };

}(this));
