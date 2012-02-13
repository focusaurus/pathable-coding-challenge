(function($, undefined){
//Private List methods
function mid(model) {
  return model.get(model.idAttribute);
}

function syncViews() {
  this.views = this.collection.map(this.findView, this);
  if (this.options.selectable) {
    this.selected = null;
  }
  this.render();
}

function listTag() {
  return /^(ol|li)$/i.test(this.tagName);
}

var List = Backbone.List = Backbone.View.extend({

  initialize: function(options) {
    this._viewCache = {byId: {}, byCid: {}, byViewCid: {}};
    _.each(['add', 'remove', 'reset'], function(event) {
      this.collection.bind(event, syncViews, this);
      if (options.selectable && event != 'add') {
        this.collection.bind(event, function() {
          this.selected = undefined;
        }, this);
      }
    }, this);
    this.tagName = options.tagName || 'ol';
    this.$el = $('<' + this.tagName + '/>');
    this.el = this.$el.first();
    syncViews.apply(this);
  },

  _makeView: function(model) {
    var viewClass = this.options.itemType || Backbone.View;
    var itemOptions = _.defaults(this.options.itemOptions || {}, {model: model});
    var viewTagIsDiv = (itemOptions.tagName || "div").toLowerCase() === 'div';
    if (listTag.apply(this) && viewTagIsDiv) {
      itemOptions.tagName = 'li';
    }
    var view = new viewClass(itemOptions);
    var _mid = mid(model);
    if (_mid) {
      this._viewCache.byId[_mid] = view;
    }
    if (model.cid) {
      this._viewCache.byCid[model.cid] = view;
    }
    this._viewCache.byViewCid[view.cid] = view;
    view.bind('all', function() {
      this.trigger.apply(this, arguments);
    }, this);
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
      var _mid = mid(model);
      var view = this._viewCache.byId[_mid];
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
        return mid(m) == model;
      }, this);
      if (model) {
        return _.find(_.values(this._viewCache.byViewCid), function(view) {
          return view.model === model;
        });
      }
      return null;
    }
  },



  _shouldWrap: function(view) {
    var viewIsLi = view.tagName.toLowerCase() === 'li';
    return listTag.apply(this) && !viewIsLi;
  },

  findView: function(model) {
    var view = this._cached(model);
    if (!view && this.collection.include(model)) {
      //Build a new view on demand
      return this._makeView(model);
    }
    //Don't find views that are not currently mapped to the collection
    if (_.include(this.views, view)) {
      return view;
    }
    return null;
  },

  render: function() {
    this.$el = $(this.el);
    this.$el.html('');
    this.collection.each(function(model) {
      var view = this.findView(model);
      var viewEl = view.render().el;
      if (this._shouldWrap(view)) {
        this.$el.append($("<li>").html(viewEl));
      } else {
        this.$el.append(viewEl);
      }
    }, this);
    return this;
  },

  select: function(model) {
    this.selected = this.findView(model);
  }
});
})(jQuery);
