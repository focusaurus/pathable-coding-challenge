var List = Backbone.List = Backbone.View.extend({

  initialize: function(options) {
    this._viewCache = {byId: {}, byCid: {}, byViewCid: {}};
    this.collection.bind('add', this._syncViews, this);
    this.collection.bind('remove', this._syncViews, this);
    this._syncViews();
  },

  _syncViews: function() {
    this.views = this.collection.map(this.findView, this);
    this.render();
  },

  _mid: function(model) {
    return model.get(model.idAttribute);
  },

  _makeView: function(model) {
    var viewClass = this.options.itemType || Backbone.View;
    var view = new viewClass({model: model});
    var mid = this._mid(model);
    if (mid) {
      this._viewCache.byId[mid] = view;
    }
    if (model.cid) {
      this._viewCache.byCid[model.cid] = view;
    }
    this._viewCache.byViewCid[view.cid] = view;
    return view;
  },

  _cached: function(model) {
    //The test cases pass several different types of objects/values to
    //this function. We must handle the following cases:
    //Model instance: compare to view's model by id then cid
    //Model instance who's id has been changed since we cached it
    //Model id number
    //Model cid string
    //View cid string
    if (model instanceof Backbone.Model) {
      //Check id first, then cid as a fallback
      var mid = this._mid(model);
      var view = this._viewCache.byId[mid];
      if (view) { return view; }
      view = this._viewCache.byCid[model.cid];
      if (view) { return view; }
      return null;
    } else {
      //Treat as an id number or string
      var caches = [this._viewCache.byId, this._viewCache.byCid,
        this._viewCache.byViewCid ];
       var cache = _.find(caches, function(cache) {
        return cache[model];
      });
      if (cache) {
        return cache[model];
      }
      //OK, last ditch is locate the model object in the collection by ID
      //then find the cached view by object
      var model = this.collection.find(function (m) {
        return this._mid(m) == model;
      }, this);
      if (model) {
        return _.find(_.values(this._viewCache.byViewCid), function(view) {
          return view.model === model;
        });
      }
      return null;
    }
  },

  findView: function(model) {
    var view = this._cached(model);
    if (!view && this.collection.include(model)) {
      //Build a new view on demand
      return this._makeView(model);
    }
    return view;
  },

  render: function() {
    var $container = $(this.el);
    $container.html('');
    this.collection.each(function(model) {
      $container.append(this.findView(model).render().el);
    }, this);
    return this;
  },

  tagName: 'ol'
});
