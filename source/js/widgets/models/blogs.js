define(["jquery","knockout"], function($,ko) {
	var Blogs = function(o) {
		var self = this;

		var d = o.options;

		this.limitStep = d.limitStep || 2;
		this.limit = this.asObservable(d.limit,this.limitStep);
		this.data = this.asObservable(d.data,{blogsData:{},users:{},blogsSections:{},blogsComments:{}});
		this.header = this.asObservable(d.header,"");
		this.showHeader = this.asObservable(d.showHeader,true);
		this.addCommentHeader = this.asObservable(d.addCommentHeader,"");
		this.showNoMessagesAlert = this.asObservable(d.showNoMessagesAlert,false);

		this.to_type = this.asObservable(d.to_type,0);
		this.to_id = this.asObservable(d.to_id,0);
		this.section = this.asObservable(d.section,0);

		this.loading = ko.observable(false);
		this.loadingAdd = ko.observable(false);
		this.modalWindow = o.options.modalWindow;

		// Этот метод грузит начальные данные виджета если они не переданы
		this.loadData = function() {
			self.loading(true);
			self.core.apiCall({
				data: {
					action: "getBlogs",
					formData: {
						to_type: self.to_type(),
						to_id: self.to_id(),
						limit: self.limit()
					}
				},
				success: function(result) {
					if (result.success) {
						self.data({
							blogsIndex: result.data.blogsIndex || [],
							blogsData: result.data.blogsData || {},
							users: result.data.users || {},
							blogsSections: result.data.blogsSections || {},
							blogsComments: result.data.blogsComments || {}
						});
					}
					if (result.error)
						self.core.error(result.error);
					self.loading(false);
				}
			});
		}

		// Этот метод догружает данные по ids
		this.loadDataAdd = function(ids) {
			self.loadingAdd(true);
			self.core.apiCall({
				data: {
					action: "getBlogsData",
					formData: {
						ids: ids
					}
				},
				success: function(result) {
					if (result.success) {
						var d = self.data();
						$.each(result.data.blogsData,function(i,rw) {
							d.blogsData[rw.id] = rw;
						});
						$.each(result.data.blogsComments,function(i,rws) {
							d.blogsComments[i] = rws;
						});
						$.each(result.data.users,function(i,rw) {
							d.users[rw.id] = rw;
						});
						self.data(d);
					}
					if (result.error) self.core.error(result.error);
					self.loadingAdd(false);
				}
			});
		}

		if (!d.hasOwnProperty("data") && this.to_id()) {
			this.requiresLoading = true;
			this.loadData();
		}

		this.noBlogs = ko.computed(function() {
			return !(self.data() && self.data().blogsIndex && self.data().blogsIndex.length > 0);
		});

		this.sectionTitle = ko.computed(function() {
			if (self.section() == 0 || !self.data || !self.data().blogsSections) return "";
			if (self.data().blogsSections[self.section()]) return self.data().blogsSections[self.section()].title;
			return "";
		});

		this.clearSection = function() {
			self.section(0);
		}

		this.blogsCnt = ko.computed(function() {
			if (!self.data || !self.data().blogsIndex) return 0;
			if (self.section() == 0) return self.data().blogsIndex.length;
			return $.grep(self.data().blogsIndex,function(rw) {
				return rw.section == self.section();
			}).length;
		});

		this.blogs = ko.computed(function() {
			if (self.limit() <= 0) return [];
			if (!self.data() || !self.data().blogsIndex) return [];
			var prevBlogs = [];
			var prevBlogsKeys = {};
			if (self.blogs && ko.isComputed(self.blogs)) {
				var prevBlogs = self.blogs();
				var prevBlogsKeys = {};
				$.each(prevBlogs,function(i,rw) {
					prevBlogsKeys[rw.id] = i;
				});
			}

			if (self.skipRecomputeBlogs && prevBlogs) {
				self.skipRecomputeBlogs = false;
				return prevBlogs;
			}

			var out = [];
			var ids2load = [];
			var rws = $.extend(true,[],self.data().blogsIndex);

			if (self.section() > 0) {
				rws = $.grep(rws,function(rw) {
					return rw.section==self.section();
				});
			}

			var rws = rws.reverse().slice(0,self.limit());

			$.each(rws,function(i,rw) {
				if (prevBlogsKeys[rw.id] >= 0) {
					rw.showFull = prevBlogs[prevBlogsKeys[rw.id]].showFull;
					rw.showComments = prevBlogs[prevBlogsKeys[rw.id]].showComments;
				}
				else {
					rw.showFull = ko.observable(false);
					rw.showComments = ko.observable(false);
				}
				rw.comments = ko.computed({
					read: function() {
						return self.data().blogsComments ? {posts:self.data().blogsComments[rw.id] || [],users:self.data().users} : {posts:[],users:self.data().users};
					},
					write: function(v) {
						if (self.data()) {
							var d = self.data();
							d.blogsComments[rw.id] = v.posts;
							d.users = v.users;
							self.skipRecomputeBlogs = true;
							self.data(d);
						}
					}
				});
				if (self.data().blogsData && self.data().blogsData[rw.id]) {
					rw.data = self.data().blogsData[rw.id];
					rw.isLoaded = true;
				}
				else ids2load.push(rw.id);
				rw.commentsCnt = ko.computed(function() {
					if (!self.data().blogsComments) return 0;
					if (!self.data().blogsComments[rw.id]) return 0;
					return self.data().blogsComments[rw.id].length;
				});
				rw.my = ko.computed(function() {
					if (!self.core.user()) return false;
					if (rw.data && rw.data.user == self.core.user().id) return true;
					return false;
				});
				if (rw.section && self.data().blogsSections && self.data().blogsSections[rw.section])
					rw.sectionTitle = self.data().blogsSections[rw.section].title;
				rw.switchFull = function(context,e) {
					rw.showFull(!rw.showFull());
				}
				rw.switchComments = function(context,e) {
					rw.showComments(!rw.showComments());
				}
				rw.editBlog = function(obj,e) {
					self.open({name:"blogForm",windowName:"blogForm",data:rw.data,blogsSections:self.data().blogsSections,id:rw.id,to_type:self.to_type(),to_id:self.to_id(),onUpdate:self.onUpdate},self,e);
				}
				rw.destroyBlog = function(obj,e) {
					self.open({name:"confirm",windowName:"confirm",message:"Вы уверены что хотите удалить этот блог?",onConfirm:function() {
						self.core.apiCall({
							data: {
								action: "destroyBlog",
								id: rw.id
							},
							success: function(result) {
								if (result.success)
									self.destroyBlog(rw.id);
								if (result.error)
									self.core.error(result.error);
							}
						});
					}});
				}
				rw.setSection = function(obj,e) {
					self.section(rw.section);
				}
				out.push(rw);
			});
			if (ids2load.length > 0) self.loadDataAdd(ids2load.join(","));
			return out;
		});

		this.onUpdate = function(data) {
			if (!data.blog || !data.blog.id) return;
			var id = data.blog.id;
			var d = self.data();

			var found = false;
			var foundIndex = null;
			$.each(d.blogsIndex,function(i,rw) {
				if (rw.id == id) {
					found = true;
					foundIndex = i;
				}
			});

			if (found) d.blogsIndex[foundIndex] = {id:data.blog.id,section:data.blog.section};
			else d.blogsIndex.push({id:data.blog.id,section:data.blog.section});

			d.blogsData[data.blog.id] = data.blog;

			if (data.blogsSections)
				$.each(data.blogsSections,function(i,rw) {
					d.blogsSections[rw.id] = rw;
				});
			if (data.blogsComments)
				$.each(data.blogsComments,function(i,rw) {
					d.blogsComments[rw.id] = rw;
				});
			if (data.users)
				$.each(data.users,function(i,rw) {
					d.users[rw.id] = rw;
				});
			self.data(d);
		}

		this.destroyBlog = function(id) {
			var d = self.data();
			var found = false;
			var foundIndex = null;
			$.each(d.blogsIndex,function(i,rw) {
				if (rw.id == id) {
					found = true;
					foundIndex = i;
				}
			});
			if (found) {
				d.blogsIndex.splice(foundIndex,1);
				self.data(d);
			}
		}

		this.createBlogEnabled = ko.computed(function() {
			if (!self.core.user()) return false;
			if (self.to_type() == 0 && self.to_id() == self.core.user().id) return true;
			// TODO: закачка фото в альбомы клубов
			return false;
		});

		this.showMore = function(obj,e) {
			self.limit((self.limit() || 0) + self.limitStep);
		}

		this.showLess = function() {
			var l = (self.limit() || 0) - self.limitStep;
			if (l < 0) l = 0;
			self.limit(l);
		}

		this.showNone = function() {
			self.limit(0);
		}

		this.showSwitch = function() {
			if (self.isHidden())
				self.showMore();
			else
				self.showNone();
		}

		this.isHidden = ko.computed(function() {
			return self.limit() == 0;
		});

		this.showMoreEnabled = ko.computed(function(e) {
			return self.blogsCnt() > self.limit();
		});

		this.showLessEnabled = ko.computed(function() {
			return self.limit() > 0;
		});

	}

	return Blogs;
});