(function (window) {
    "use strict";
    //Global configs and functions shared between js
    window.UNKNOWN_ERROR = -1;
    window.NO_MORE_DATA = -2;
    window.MODULE_NOT_FOUND = -3;
    window.numberWithCommas = function (x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    window.spin_opts = {
        lines: 9,
        length: 5,
        width: 2,
        radius: 4,
        rotate: 9,
        color: "#4c4c4c",
        speed: 1.5,
        trail: 40,
        shadow: false,
        hwaccel: true,
        className: "spinner",
        zIndex: 2000000000,
        left: "90%"
    };
    window.formatModuleName = function (module) {
        return module.replace(/_(.)/g, function (match, p1) {
            return p1.toUpperCase();
        });
    };
    window.formatModulePath = function (module) {
        return module.replace(/_(.)/g, function (match, p1) {
            return "-" + p1;
        });
    };
    window.alertError = function (error, errorMessage) {
        return asyncText("templates/alert.html").then(function (view) {
            var template = Handlebars.compile(view);
            $(template({
                error: error,
                error_message: errorMessage
            })).modal().on("hidden.bs.modal", function () {
                $(this).remove();
            });
            return Promise.resolve();
        });
    };
    /*
window.syncGet = function(url, success, headers, failure) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.onload = function () {
        if (this.status !== 200) {
            if (failure)
                failure();
            return;
        }
        success(JSON.parse(this.responseText));
    };
    xhr.onerror = function () {
        if (failure)
            failure();
    };
    if (headers) {
        for (var header in headers) {
            if (headers.hasOwnProperty(header))
                xhr.setRequestHeader(header, headers[header]);
        }
    }
    xhr.send();
}
*/
    window.asyncText = function (url, headers) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            if (xhr.overrideMimeType)
                xhr.overrideMimeType("text/plain");
            xhr.onload = function () {
                if (String(this.status) !== "200") {
                    reject(this.status);
                    return;
                }
                resolve(this.responseText);
            };
            xhr.onerror = function () {
                reject();
            };
            if (headers) {
                for (var header in headers) {
                    if (headers.hasOwnProperty(header))
                        xhr.setRequestHeader(header, headers[header]);
                }
            }
            xhr.send();
        });
    };
    window.asyncGet = function (url, headers, jsonp) {
        if (headers || typeof $ !== "function")
            return asyncText(url, headers).then(function (res) {
                return Promise.resolve(JSON.parse(res));
            });
        else
            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: url,
                    jsonp: jsonp,
                    contentType: "application/json; charset=utf-8",
                    type: "GET",
                    dataType: "jsonp",
                    async: false,
                    success: function (res) {
                        resolve(res);
                    },
                    error: function (xhr, status) {
                        reject(status);
                    }
                });
            });
    };
    window.loadJS = function (src, obj, data, parentEl) {
        return new Promise(function (resolve, reject) {
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.async = true;
            script.src = src.replace(/^\/\//, "https:" === document.location.protocol ? "https://" : "http://");
            if (obj)
                for (var opt in obj)
                    if (obj.hasOwnProperty(opt))
                        script[opt] = obj[opt];
            if (data)
                for (var el in data)
                    if (data.hasOwnProperty(el))
                        script.dataset[el] = data[el];
            function onload(e) {
                /* jshint validthis:true */
                this.removeEventListener("load", onload);
                this.removeEventListener("loadend", onload);
                this.removeEventListener("afterscriptexecute", onload);
                resolve();
            }
            script.addEventListener("load", onload);
            script.addEventListener("loadend", onload);
            script.addEventListener("afterscriptexecute", onload);
            (parentEl || document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(script);
        });
    };
    window.exportM = function (obj, name) {
        //	if(window.System) {
        //	        /*jshint esnext:true*/
        //		export default obj;
        //	} else
        if (typeof module !== "undefined" && module.export) {
            module.export[name] = obj;
        } else if (typeof define === "function" && define.amd) {
            define(name, function () {
                return obj;
            });
        } else {
            window[name] = obj;
        }
    };
    window.exportBlog = function (blog, name) {
        exportM(blog, formatModuleName(name) + "Blog");
    };
    window.exportService = function (service, name) {
        exportM(service, formatModuleName(name) + "Service");
    };
    window.exportPlugin = function (plugin, name) {
        exportM(plugin, formatModuleName(name) + "Plugin");
    };
    window.importM = function (name, path) {
        return new Promise(function (resolve, reject) {
            if (window[name]) {
                resolve(window[name]);    //		} else if (window.System) {
                                          //			/*global System*/
                                          //			System.import(path).then(function(_) {
                                          //				resolve(_[name] || _);
                                          //			});
            } else if (typeof define === "function" && define.amd) {
                require([path], function (_) {
                    resolve(_[name], _);
                });
            } else if (typeof module !== "undefined" && module.exports) {
                var _module = require(path);
                resolve(_module[name] || _module);
            } else {
                loadJS(path + ".js").then(function () {
                    resolve(window[name]);
                });
            }
        });
    };
}(window || global));"use strict";
/** renderBlogPosts
     *
     * Takes the response from the blog platform and renders it using
     * our Handlebars template.
     */
function renderBlogPosts(posts, clearPosts) {
    if (posts.length === 0) {
        window.reachedEnd = true;
    }
    Promise.all([
        asyncText("templates/blog-post-text.html"),
        asyncText("templates/blog-post-photo.html"),
        asyncText("templates/blog-post-link.html"),
        asyncText("templates/blog-post-video.html"),
        asyncText("templates/blog-post-audio.html"),
        asyncText("templates/blog-post-quote.html")
    ]).then(function (res) {
        var text_template = Handlebars.compile(res[0]), photo_template = Handlebars.compile(res[1]), link_template = Handlebars.compile(res[2]), video_template = Handlebars.compile(res[3]), audio_template = Handlebars.compile(res[4]), quote_template = Handlebars.compile(res[5]);
        $(".loading").remove();
        if (clearPosts)
            $("#blog-posts").empty();
        if (posts.length === 1 && window.disqus_enabled)
            posts[0].disqus_open = true;
        posts = posts.forEach(function (p) {
            p.formated_date = moment.utc(p.date, "YYYY-MM-DD HH:mm:ss").local().format("MMMM DD, YYYY");
            if (window.disqus_enabled)
                p.disqus_enabled = true;
            p.disqus_just_count = window.disqus_just_count;
            if (p.type === "text") {
                var idx = p.body.indexOf("<!-- more -->");
                if (idx > 0) {
                    p.body = p.body.substring(0, idx);
                    p.show_more = true;
                }
                $("#blog-posts").append(text_template(p));
            } else if (p.type === "photo")
                $("#blog-posts").append(photo_template(p));
            else if (p.type === "link")
                $("#blog-posts").append(link_template(p));
            else if (p.type === "video")
                $("#blog-posts").append(video_template(p));
            else if (p.type === "audio")
                $("#blog-posts").append(audio_template(p));
            else if (p.type === "quote")
                $("#blog-posts").append(quote_template(p));
        });
        prettyPrint();
        setTimeout(setupBlogHeaderScroll, 1000);
        adjustSelection("home");
        document.body.dispatchEvent(new CustomEvent("blog-post-loaded"));
    });
}
/**
     * fetchBlogPosts
     *
     * @param {(Number|String)} offset The offset at which to start loading posts.
     * @param {Object} settings current blogging platform settings from config.json
     * @param {String} platform argument to specify which blog platform to fetch from. Defaults to 'tumblr'.
     * @param {Object} posts_options Optional set searched post options
     */
function fetchBlogPosts(offset, settings, platform, posts_options) {
    //Not sure how my old self wrote this code and how it stills runs
    if (posts_options && posts_options.id)
        window.reachedEnd = true;
    return importM(formatModuleName(platform) + "Blog", "blogs/" + formatModulePath(platform)).then(function ($blog) {
        //    var $blog = window[formatModuleName(platform) + "Blog"];
        if (!$blog)
            return Promise.reject(MODULE_NOT_FOUND);
        var posts;
        if (posts_options && posts_options.id)
            posts = $blog.fetchPost(settings, posts_options.id);
        else if (posts_options && posts_options.tag)
            if (offset)
                posts = $blog.fetchTagMore(settings, posts_options.tag);
            else
                posts = $blog.fetchTag(settings, posts_options.tag);
        else if (offset)
            posts = $blog.fetchMore(settings);
        else
            posts = $blog.fetch(settings);
        return posts.then(function (data) {
            if (!data || data.length === 0)
                return Promise.resolve(false);
            renderBlogPosts(data, posts_options && posts_options.id || !offset);
            return Promise.resolve(true);
        }).catch(function (error) {
            alertError(error);
            return Promise.resolve(false);
        });
    });
}
function setupBlogHeaderScroll() {
    if (window.isMobileView)
        return;
    $(".blog-section article hgroup h3 a").click(function (e) {
        if (!this.hash)
            return;
        $("html, body").stop().animate({ scrollTop: $(this.hash).offset().top }, 500, "linear");
        e.preventDefault();
    });
    var dateHeight = $("#blog-posts article hgroup h3 a")[0].scrollHeight;
    $(window).scroll(function () {
        var scrollTop = window.scrollY;
        var first = false;
        $("#blog-posts article").each(function () {
            if (window.scrollY < this.offsetTop)
                this.className = "";    //return; }
            else if (window.scrollY > this.offsetTop + this.scrollHeight - dateHeight)
                this.className = "passed";
            else
                this.className = "current";
        });
    });
}"use strict";
var postOffset, postsOpts;
function setupBlog(settings) {
    registerPostLinkClick(settings);
    registerTagLinkClick(settings);
    registerHomeItemClick(settings);
    window.sharethis_enabled = settings["blogs_settings"]["plugins"]["sharethis"] || false;
    if (settings["blogs_settings"]["plugins"]["disqus"])
        importM("disqusPlugin", "plugins/disqus").then(function ($plugin) {
            $plugin.setup(settings["plugins_settings"]["disqus"]);
        });
    window.reachedEnd = false;
    if (location.hash.substr(0, 7) === "#!post/")
        postsOpts = { id: location.hash.slice(7).split("#")[0] };
    else if (location.hash.substr(0, 6) === "#!tag/")
        postsOpts = { tag: location.hash.slice(6).split("#")[0] };
    return fetchBlogPosts(0, settings["blogs_settings"][settings["blog_platform"]], settings["blog_platform"], postsOpts).then(function (offset) {
        postOffset = offset;
        if (window.sharethis_enabled)
            importM("sharethisPlugin", "plugins/sharethis").then(function ($plugin) {
                $plugin.setup(settings["plugins_settings"]["sharethis"]);
            });
        return Promise.resolve();
    });
}
function registerPostLinkClick(settings) {
    $(document).on("click", ".post-link", function () {
        if (this.dataset["id"]) {
            postsOpts = { id: this.dataset["id"] };
            fetchBlogPosts(0, settings["blogs_settings"][settings["blog_platform"]], settings["blog_platform"], postsOpts);
        }
        postOffset = 0;
    });
}
function registerTagLinkClick(settings) {
    $(document).on("click", ".tag-link", function () {
        if (this.textContent) {
            window.reachedEnd = false;
            postsOpts = { tag: this.textContent };
            fetchBlogPosts(0, settings["blogs_settings"][settings["blog_platform"]], settings["blog_platform"], postsOpts).then(function (offset) {
                postOffset = offset;
            });
        }
    });
}
function registerHomeItemClick(settings) {
    $("#home-item-link").on("click", function () {
        if (location.hash.substr(0, 2) !== "#!")
            return;
        location.hash = "";
        postsOpts = undefined;
        window.reachedEnd = false;
        fetchBlogPosts(0, settings["blogs_settings"][settings["blog_platform"]], settings["blog_platform"]).then(function (offset) {
            postOffset = offset;
        });
    });
}
function registerScroll(settings) {
    var resultsLoaded = false, scrollWait = false, scrollWaitDur = 250;
    $(window).scroll(function () {
        if (!window.reachedEnd && !resultsLoaded && !scrollWait && postOffset && $(window).scrollTop() + $(window).height() > $(document).height() / 1.2) {
            resultsLoaded = true;
            scrollWait = true;
            fetchBlogPosts(postOffset, settings["blogs_settings"][settings["blog_platform"]], settings["blog_platform"], postsOpts).then(function (offset) {
                postOffset = offset;
                scrollWait = false;
            });
            // Only load posts at most every scrollWaitDur milliseconds.
            setTimeout(function () {
                scrollWait = false;
            }, scrollWaitDur);
        }
        if (resultsLoaded && $(window).scrollTop() + $(window).height() < $(document).height() / 1.2) {
            resultsLoaded = false;
        }
    });
}"use strict";
var allComponents = [], enabledServices = [];
window.currSelection = "home";
function setupLinks(settings) {
    allComponents = Object.keys(settings.services);
    allComponents.forEach(function (service) {
        if (settings["services"][service])
            enabledServices.push(service);
    });
    if (typeof settings["fields"]["contact"] === "object") {
        if (Object.keys(settings["fields"]["contact"]).length === 1 && settings["fields"]["contact"].email) {
            settings["fields"]["contact"] = settings["fields"]["contact"].email;
        } else {
            enabledServices.push("contact");
            settings["services_settings"]["contact"] = settings["fields"]["contact"];
            settings["services_settings"]["contact"]["url"] = "mailto:" + settings["fields"]["contact"]["email"];
        }
    }
    //CREATE LINKS ITEMS FOR ENABLED SERVICES
    var main_nav = document.getElementById("main-nav"), i;
    main_nav.innerHTML = "";
    if (settings["blog_platform"].length)
        addLinkItem(main_nav, "home", "Home", "#");
    for (i = 0; i < enabledServices.length; i++) {
        var service = enabledServices[i];
        var $service = window[formatModuleName(service) + "Service"];
        var text;
        if ($service)
            text = $service.displayName;
        else
            text = service[0].toUpperCase() + service.slice(1);
        addLinkItem(main_nav, service, text);
    }
    if (typeof settings["fields"]["contact"] === "string")
        addLinkItem(main_nav, "contact", "Contact", "mailto:" + settings["fields"]["contact"] + "?subject=Hello");
    linkClickHandler(settings);
    processHash();
}
function addLinkItem(main_nav, name, text, href) {
    var li, link;
    li = document.createElement("li");
    link = document.createElement("a");
    link.href = href || "#" + name;
    link.id = name + "-item-link";
    link.textContent = text;
    li.appendChild(link);
    main_nav.appendChild(li);
}
function linkClickHandler(settings) {
    $("#main-nav a").click(function (e) {
        var newSelection;
        if (e.which === 2)
            return;
        e.preventDefault();
        e.stopPropagation();
        // get the name of newly selected item
        if (this.id === "home-item-link") {
            newSelection = "home";
        } else {
            var i;
            for (i = 0; i < enabledServices.length; i++) {
                var service = enabledServices[i];
                if (this.id === service + "-item-link") {
                    newSelection = service;
                    break;
                }
            }
        }
        // then  handle the click depending on this newly selected item name
        if (newSelection === undefined)
            window.location = this.href;
        else if (newSelection === currSelection)
            return;
        else if (newSelection === "home")
            adjustSelection("home");
        else
            adjustSelection(newSelection, setupService.bind(this, newSelection, this, settings["services_settings"][newSelection]));
    });
}
function adjustSelection(component, callback) {
    var transition, $currProfileEl;
    if (currSelection !== "home") {
        $currProfileEl = $("#" + currSelection + "-profile");
        transition = $.support.transition && $currProfileEl.hasClass("fade");
        $currProfileEl.modal("hide");
        if (callback) {
            if (transition) {
                $currProfileEl.one($.support.transition.end, callback);
            } else {
                callback();
            }
        }
    } else if (callback) {
        callback();
    }
    $(".main-nav").children("li").removeClass("sel");
    $("#" + component + "-item-link").parent().addClass("sel");
    window.currSelection = component;
}
function processHash() {
    // if location hash is an item name, click it
    var hash = window.location.hash.slice(1);
    if (hash && hash.match(/^[\w-]+$/)) {
        var item = document.getElementById(hash + "-item-link");
        if (item && item.parentElement.parentElement.id === "main-nav")
            item.click();
    }
}"use strict";
function main() {
    asyncGet("config.json", {}).then(function (settings) {
        //FIELDS SETTINGS
        function getHostname(url) {
            var parser = document.createElement("a");
            parser.href = url;
            return parser.hostname;
        }
        document.getElementById("field-realname").textContent = settings["fields"]["realname"];
        document.getElementById("field-description").textContent = settings["fields"]["description"];
        document.getElementById("field-url").textContent = getHostname(settings["fields"]["url"]);
        document.head.getElementsByTagName("title")[0].textContent = settings["fields"]["username"] + " [" + settings["fields"]["realname"] + "]";
        document.getElementById("meta-description").content = settings["fields"]["realname"] + " : " + settings["fields"]["description"];
        //SERVICES SETTINGS
        if (settings["services"]["flickr"])
            window.flickr_id = settings["services_settings"]["flickr"]["id"];
        if (settings["services"]["tent"]) {
            window.tent_entity_uri = settings["services_settings"]["tent"]["entity_uri"];
            window.tent_feed_uri = settings["services_settings"]["tent"]["feed_url"];
        }
        $(function () {
            new Promise(function (resolve, reject) {
                setupLinks(settings);
                resolve();
            }).then(setupBlog(settings)).then(function () {
                document.getElementById("profiles-style").media = "all";
                setupPlugins(settings);
            });
        });
    }).catch(function (error) {
        console.error("ERROR: Main Promise Rejected! To bad to break a vow");
        alertError(error).catch(function () {
            alert("ERROR! " + error);
        });
    });
}
if (window.Promise === undefined) {
    var scr = document.createElement("script");
    scr.type = "text/javascript";
    scr.src = "https://es6-promises.s3.amazonaws.com/es6-promise-2.0.1.min.js";
    scr.async = false;
    scr.onload = function () {
        /* global ES6Promise:true */
        ES6Promise.polyfill();
        main();
    };
    document.getElementsByTagName("head")[0].appendChild(scr);
} else {
    main();
}"use strict";
var isMobileView = false;
if (typeof window.matchMedia !== "undefined") {
    var mediaQuery = window.matchMedia("(max-width:799px)");
    if (mediaQuery.matches) {
        isMobileView = true;
    }
}
$(function () {
    $("#mobile-nav-btn").click(function () {
        $(".main-section").toggleClass("nav-opened");
    });
});"use strict";
function setupPlugins(settings) {
    return Promise.all(pluginsPromises(settings));
}
function pluginsPromises(settings) {
    return Object.keys(settings["plugins"]).filter(function (plugin) {
        return settings["plugins"][plugin];
    }).map(function (plugin) {
        return setupPlugin(plugin, settings["plugins_settings"][plugin]).then(console.log.bind(console, "Plugin Setuped:", plugin)).catch(console.error.bind(console, "Plugin Not Found", plugin));
    });
}
function setupPlugin(plugin, settings) {
    return new Promise(function (resolve, reject) {
        importM(formatModuleName(plugin) + "Plugin", "plugins/" + formatModulePath(plugin)).then(function ($plugin) {
            if ($plugin) {
                $plugin.setup(settings);
                resolve();
            } else {
                reject(MODULE_NOT_FOUND);
            }
        });
    });
}"use strict";
function setupService(service, el, settings) {
    return importM(formatModuleName(service) + "Service", "services/" + formatModulePath(service)).then(function ($service) {
        if (!$service) {
            alertError("Service Not Found", service);
            return Promise.reject();
        }
        settings.url = $service.getURL(settings);
        // just open url in case of errors
        if ($("#" + service + "-profile").length > 0) {
            window.location = settings.url;
            return;
        }
        // show spinner
        var spinner = new Spinner(spin_opts).spin();
        $("#" + service + "-item-link").append(spinner.el);
        var promises = [
            $service.fetch(settings),
            asyncText("templates/" + $service.template)
        ];
        if ($service.supportMore)
            promises.push(asyncText("templates/" + $service.templateMore));
        // request templates && fetch service data
        return Promise.all(promises).then(function (results) {
            var serviceData = results[0], view = results[1], viewMore = results[2];
            var $modal;
            if (!serviceData || serviceData.error) {
                window.location = settings.url;
                return;
            }
            // compile the current view template
            var template = Handlebars.compile(view);
            // setup the template data
            serviceData = $service.setup(serviceData, settings);
            if (!serviceData) {
                window.location = settings.url;
                return;
            }
            $modal = $(template(serviceData)).modal().on("hidden.bs.modal", function () {
                $(this).remove();
                if (currSelection === service) {
                    adjustSelection("home");
                }
            });
            // If service support fetching more data
            if ($service.supportMore) {
                var moreTemplate = Handlebars.compile(viewMore);
                $modal.find("#load-more-data").click(function (e) {
                    var spinnerMore = new Spinner(spin_opts).spin();
                    $(this).append(spinnerMore.el);
                    // fetch more service data && add it to the modal
                    $service.fetchMore(settings).then(function (serviceMoreData) {
                        serviceMoreData = $service.setupMore(serviceMoreData, settings);
                        $("." + service + " .profile-data").append(moreTemplate(serviceMoreData));
                        spinnerMore.stop();
                    }).catch(function (error) {
                        if (error === NO_MORE_DATA) {
                            $(this).remove();
                        }
                        spinnerMore.stop();
                    });
                });
            }
            spinner.stop();
            console.info("Service Setuped:", service);
        }).catch(function (error) {
            //TODO
            alertError(error);
            console.error("Service Not Setuped:", service);
        });
    });
}(function (window) {
    "use strict";
    var API_URL = "https://www.googleapis.com/blogger/v3/";
    var nextId = 0;
    function getPosts(settings, postId, tag, offset) {
        var params = "?maxResults=20&key=" + settings.api_key + "&fields=items(content%2Cid%2Clabels%2Cpublished%2Ctitle%2Curl)" + "%2CnextPageToken";
        if (offset && nextId)
            params += "&pageToken=" + nextId;
        if (tag)
            params += "&labels=" + tag;
        else if (settings.tag_slug)
            params += "&labels=" + tag;
        if (postId)
            params = "/" + postId + "?key=" + settings.api_key + "&content%2Cid%2Clabels%2Cpublished%2Ctitle%2Curl";
        return asyncGet(API_URL + "blogs/" + settings.blog_id + "/posts" + params).then(function (res) {
            if (res.error) {
                window.reachedEnd = true;
                return Promise.resolve([]);
            }
            nextId = res.nextPageToken;
            if (!nextId)
                window.reachedEnd = true;
            if (postId)
                res = { items: [res] };
            res["items"].forEach(function (post) {
                post.date = post.published;
                post.body = post.content;
                post.tags = post.labels;
                post.tags = post.labels;
                post.type = "text";    //????
            });
            return Promise.resolve(res["items"]);
        });
    }
    function fetchPosts(settings) {
        nextId = "";
        return getPosts(settings, undefined, undefined, false);
    }
    function fetchMorePosts(settings) {
        return getPosts(settings, undefined, undefined, true);
    }
    function fetchOnePost(settings, postId) {
        nextId = "";
        return getPosts(settings, postId, undefined, false);
    }
    function fetchBlogTag(settings, tag) {
        nextId = "";
        return getPosts(settings, undefined, tag, false);
    }
    function fetchBlogTagMore(settings, tag) {
        return getPosts(settings, undefined, tag, true);
    }
    exportBlog({
        fetch: fetchPosts,
        fetchMore: fetchMorePosts,
        fetchPost: fetchOnePost,
        fetchTag: fetchBlogTag,
        fetchTagMore: fetchBlogTagMore
    }, "blogger");
}(window));(function (window) {
    "use strict";
    var API_URL = "https://api.tumblr.com/v2/blog/";
    var nextId = 0;
    function getPosts(settings, postId, tag, offset) {
        var params = "?api_key=" + settings.api_key;
        if (postId)
            params += "&id=" + postId;
        else if (tag)
            params += "&tag=" + tag;
        else if (settings.tag_slug)
            params += "&tag=" + settings.tag_slug;
        if (offset)
            params = "&offset=" + nextId;
        return asyncGet(API_URL + settings.blog_url + "/posts" + params).then(function (res) {
            nextId += 20;
            return Promise.resolve(res.response.posts);
        });
    }
    function fetchPosts(settings) {
        nextId = 0;
        return getPosts(settings, undefined, undefined, false);
    }
    function fetchMorePosts(settings) {
        return getPosts(settings, undefined, undefined, true);
    }
    function fetchOnePost(settings, postId) {
        nextId = 0;
        return getPosts(settings, postId, undefined, false);
    }
    function fetchBlogTag(settings, tag) {
        nextId = 0;
        return getPosts(settings, undefined, tag, false);
    }
    function fetchBlogTagMore(settings, tag) {
        return getPosts(settings, undefined, tag, true);
    }
    exportBlog({
        fetch: fetchPosts,
        fetchMore: fetchMorePosts,
        fetchPost: fetchOnePost,
        fetchTag: fetchBlogTag,
        fetchTagMore: fetchBlogTagMore
    }, "tumblr");
}(window));(function (window) {
    "use strict";
    var API_URL = "https://public-api.wordpress.com/rest/v1";
    var nextId = 0;
    function getPosts(settings, postId, tag, offset) {
        var post_id = "";
        var params = "";
        if (postId)
            post_id += postId;
        else if (tag)
            params += "?tag=" + tag.replace(/\s/g, "-");
        else if (settings.tag_slug)
            params += "?tag=" + settings.tag_slug.replace(/\s/g, "-");
        if (offset && nextId)
            params += (params ? "&" : "?") + "offset=" + nextId;
        var wpApiUrl = [
            API_URL,
            "/sites/",
            settings.blog_url,
            "/posts/",
            post_id,
            params
        ].join("");
        return asyncGet(wpApiUrl).then(function (data) {
            if (data.error)
                data = {
                    found: 0,
                    posts: []
                };
            else if (postId)
                data = {
                    found: 1,
                    posts: [data]
                };
            data.posts.forEach(function (p, i) {
                var newTags = [];
                p.id = p.ID;
                p.body = p.content;
                p.content = null;
                if (p.type === "post") {
                    p.type = "text";
                }
                for (var tag in p.tags) {
                    if (p.tags.hasOwnProperty(tag))
                        newTags.push(tag);
                }
                p.tags = newTags;
                // TODO: figure out how to preserve timezone info and make it
                // consistent with python's datetime.strptime
                if (p.date.lastIndexOf("+") > 0) {
                    p.date = p.date.substring(0, p.date.lastIndexOf("+"));
                } else {
                    p.date = p.date.substring(0, p.date.lastIndexOf("-"));
                }
            });
            nextId += 20;
            return Promise.resolve(data.posts);
        });
    }
    function fetchPosts(settings) {
        nextId = 0;
        return getPosts(settings, undefined, undefined, false);
    }
    function fetchMorePosts(settings) {
        return getPosts(settings, undefined, undefined, true);
    }
    function fetchOnePost(settings, postId) {
        nextId = 0;
        return getPosts(settings, postId, undefined, false);
    }
    function fetchBlogTag(settings, tag) {
        nextId = 0;
        return getPosts(settings, undefined, tag, false);
    }
    function fetchBlogTagMore(settings, tag) {
        return getPosts(settings, undefined, tag, true);
    }
    exportBlog({
        fetch: fetchPosts,
        fetchMore: fetchMorePosts,
        fetchPost: fetchOnePost,
        fetchTag: fetchBlogTag,
        fetchTagMore: fetchBlogTagMore
    }, "wordpress");
}(window));