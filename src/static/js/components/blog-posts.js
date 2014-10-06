"use strict";

function adjustBlogHeaders() {
    if (window.isMobileView)
        return;

    $(".blog-section article hgroup").each(function(i, e) {
        $(e).find("h3 a").css({
            "margin-top": "-" + ($(e).height() + 100) + "px"
        }).addClass("adjusted");
    });
}

function setupBlogHeaderScroll() {

        if (window.isMobileView)
            return;

        var previousTarget,
            activeTarget,
            $window = $(window),
            offsets = [],
            targets = [],
            $posts = $(".blog-section article hgroup h3 a").each(function() {
                if (this.hash) {
                    targets.push(this.hash);
                    offsets.push($(this.hash).offset().top);
                }
            });

        function processScroll(e) {
            var scrollTop = $window.scrollTop(),
                i = offsets.length;

            for (i; i--;) {
                if (activeTarget !== targets[i] && scrollTop > offsets[i] && (!offsets[i + 1] || scrollTop < offsets[i + 1])) {

                    var hgroup = $(activeTarget).find("hgroup");
                    var margintop = "";
                    if (hgroup.length) {
                        margintop = "-" + ($(hgroup[0]).height() + 100) + "px";
                    }

                    //set current target to be absolute
                    $("h3 a[href=" + activeTarget + "]").removeClass("active").css({
                        position: "absolute",
                        top: "auto",
                        "margin-top": margintop
                    });

                    //set new target to be fixed
                    activeTarget = targets[i];
                    $("h3 a[href=" + activeTarget + "]").attr("style", "").addClass("active");
                }

                if (activeTarget && activeTarget !== targets[i] && scrollTop + 50 >= offsets[i] && (!offsets[i + 1] || scrollTop + 50 <= offsets[i + 1])) {

                    // if it's close to the new target scroll the current target up
                    $("h3 a[href=" + activeTarget + "]")
                        .removeClass("active")
                        .css({
                            position: "absolute",
                            top: ($(activeTarget).outerHeight(true) + $(activeTarget).offset().top - 50) + "px",
                            bottom: "auto"
                        });
                }

                if (activeTarget === targets[i] && scrollTop > offsets[i] - 50 && (!offsets[i + 1] || scrollTop <= offsets[i + 1] - 50)) {
                    // if the current target is not fixed make it fixed.
                    if (!$("h3 a[href=" + activeTarget + "]").hasClass("active")) {
                        $("h3 a[href=" + activeTarget + "]").attr("style", "").addClass("active");
                    }
                }
            }
        }

        $posts.click(function(e) {
            if (!this.hash)
                return;
            $("html, body").stop().animate({
                scrollTop: $(this.hash).offset().top
            }, 500, "linear");

            processScroll();
            e.preventDefault();
        });

        $window.scroll(processScroll).trigger("scroll");
    }
    /** renderBlogPosts
     *
     * Takes the response from the blog platform and renders it using
     * our Handlebars template.
     */
function renderBlogPosts(posts, clearPosts) {
    if (posts.length === 0) {
        window.reachedEnd = true;
    }

    //Update this every time there are changes to the required 
    //templates since it's cached every time
    require.config({
        urlArgs: "bust=v2"
    });

    require(["text!templates/blog-post-text.html",
            "text!templates/blog-post-photo.html",
            "text!templates/blog-post-link.html",
            "text!templates/blog-post-video.html",
            "text!templates/blog-post-audio.html",
            "text!templates/blog-post-quote.html"
        ],

        function(text_post_template, photo_post_template,
            link_post_template, video_post_template,
            audio_post_template, quote_post_template) {

            var text_template = Handlebars.compile(text_post_template),
                photo_template = Handlebars.compile(photo_post_template),
                link_template = Handlebars.compile(link_post_template),
                video_template = Handlebars.compile(video_post_template),
                audio_template = Handlebars.compile(audio_post_template),
                quote_template = Handlebars.compile(quote_post_template);

            $(".loading").remove();
            if (clearPosts)
                $("#blog-posts").empty();
            $.each(posts, function(i, p) {
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

            adjustBlogHeaders();
            prettyPrint();
            setTimeout(setupBlogHeaderScroll, 1000);
            adjustSelection("home");

            $("body").trigger("blog-post-loaded");
        });
}

function fetchBloggerBlogPosts(offset, settings, posts_options) {
    var params = "?maxResults=20&fields=items(content%2Cid%2Clabels%2Cpublished%2Ctitle%2Curl)%2CnextPageToken&key=" + settings.api_key;
    if (offset)
        params += "&pageToken=" + offset;
    if (posts_options && posts_options.tag)
        params += "&labels=" + posts_options.tag;
    else if (settings.tag_slug)
        params += "&labels=" + settings.tag_slug;
    if (posts_options && posts_options.id)
        params = "/" + posts_options.id + "?content%2Cid%2Clabels%2Cpublished%2Ctitle%2Curl&key=" + settings.api_key;
    return asyncGet(settings.api_url + "blogs/" + settings.blog_id + "/posts" + params).then(function(res) {
        var clearPosts = (posts_options && posts_options.id) || !offset;
        offset = res.nextPageToken;
        if (!offset)
            window.reachedEnd = true;
        if (posts_options && posts_options.id)
            res = {
                items: [res]
            };
        res["items"].forEach(function(post) {
            post.date = post.published;
            post.body = post.content;
            post.tags = post.labels;
            post.tags = post.labels;
            post.type = "text"; //????
        });
        renderBlogPosts(res["items"], clearPosts);
        return Promise.resolve(offset);
    });
}

function fetchTumblrBlogPosts(offset, settings, posts_options) {
    var post_id = "",
        tags = "";
    if (posts_options && posts_options.id)
        post_id = "&id=" + posts_options.id;
    else if (posts_options && posts_options.tag)
        tags = posts_options.tag;
    else if (settings.tag_slug)
        tags = settings.tag_slug;
    if (!offset)
        offset = 0;
    return asyncGet(settings.api_url + settings.blog_url + "/posts?offset=" + offset + "&tag=" + tags + "&api_key=" + settings.api_key + post_id).then(function(res) {
        renderBlogPosts(res.posts, (posts_options && posts_options.id) || !offset);
        return Promise.resolve(offset + 20);
    });
}

function fetchWordpressBlogPosts(offset, settings, posts_options) {
    var post_id = "",
        tags = "";
    if (posts_options && posts_options.id)
        post_id = posts_options.id;
    else if (posts_options && posts_options.tag)
        tags = posts_options.tag;
    else if (settings.tag_slug)
        tags = settings.tag_slug;
    if (!offset)
        offset = 0;
    var wpApiUrl = [settings.api_url, "/sites/", settings.blog_url, "/posts/", post_id, "?callback=?"].join("");

    if (offset > 0) {
        wpApiUrl += "&offset=" + offset;
    }
    if (tags) {
        wpApiUrl += "&tag=" + tags.replace(/\s/g, "-");
    }

    return asyncGet(wpApiUrl).then(function(data) {

        // Get the data into a similar format as Tumblr so we can reuse the template
        if (data.error)
            data = {
                found: 0,
                posts: []
            };
        else if (posts_options && posts_options.id)
            data = {
                found: 1,
                posts: [data]
            };
        $.each(data.posts, function(i, p) {
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
            // TODO: figure out how to preserve timezone info and make it consistent with
            // python's datetime.strptime
            if (p.date.lastIndexOf("+") > 0) {
                p.date = p.date.substring(0, p.date.lastIndexOf("+"));
            } else {
                p.date = p.date.substring(0, p.date.lastIndexOf("-"));
            }
        });
        renderBlogPosts(data.posts, (posts_options && posts_options.id) || !offset);
        return Promise.resolve(offset + 20);
    });
}

/**
 * fetchBlogPosts
 *
 * @param offset Number The offset at which to start loading posts.
 * @param tag String Optional argument to specify to load posts with a certain tag.
 * @param platform String Optional argument to specify which blog platform to fetch from. Defaults to 'tumblr'.
 */
function fetchBlogPosts(offset, settings, platform, posts_options) {
    if (posts_options && posts_options.id)
        window.reachedEnd = true;
    return window["fetch" + platform[0].toUpperCase() + platform.slice(1) + "BlogPosts"](offset, settings, posts_options);
}
