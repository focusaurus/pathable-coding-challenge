var List = Backbone.List = Backbone.View.extend({

  initialize: function(options) {
    this.collection.bind('add', function(model) {
      this.views.push(this._viewFor(model));
    }, this);
    this.views = _.map(this.collection.models, this._viewFor, this);
  },

  _viewFor: function(model) {

    return new Backbone.View({model: model, tagName: 'li'});
  },

  findView: function(model) {
    return _.find(this.views, function(view) {
      //The test cases pass several different types of objects/values to
      //this function. We must handle the following cases:
      //Model instance: compare to view's model by id then cid
      //Model id number
      //Model cid string
      //View cid string
      var viewModelId = view.model.get(view.model.idAttribute);
      if (typeof(model) === 'object') {
        //treat as Model instace
        return (model.id == viewModelId) || (model.cid == view.model.cid);
      } else {
        //Treat as an id number or string
        return _.find([viewModelId, view.model.cid, view.cid], function (it) {
          return it == model;
        });
      }
    });
  },

  render: function() {
    //var $ = this.$;
    var $container = $(this.el);
    _.each(this.views, function(view) {
      $container.append(view.render().el);
    });
    return this;
  },

  tagName: 'ol'
});
