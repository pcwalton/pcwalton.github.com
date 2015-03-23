
var visitor = new Visitor("F7093025512D2B690A490D44@AdobeOrg");
visitor.trackingServer = "stats2.newyorker.com"; // same as s.trackingServer
visitor.trackingServerSecure = "stats2.newyorker.com"; //same as s.trackingServerSecure

/*
 ============== DO NOT ALTER ANYTHING BELOW THIS LINE ! ============

 Adobe Visitor API for JavaScript version: 1.3
 Copyright 1996-2013 Adobe, Inc. All Rights Reserved
 More info available at http://www.omniture.com
*/
function Visitor(k, s) {
    if (!k) throw "Visitor requires Adobe Marketing Cloud Org ID";
    var a = this;
    a.version = "1.3";
    var h = window;
    h.s_c_in || (h.s_c_il = [], h.s_c_in = 0);
    a._c = "Visitor";
    a._il = h.s_c_il;
    a._in = h.s_c_in;
    a._il[a._in] = a;
    h.s_c_in++;
    var o = h.document,
        i = h.P;
    i || (i = null);
    var j = h.Q;
    j || (j = !0);
    var p = h.O;
    p || (p = !1);
    a.D = function (a) {
        var c = 0,
            b, e;
        if (a)
            for (b = 0; b < a.length; b++) e = a.charCodeAt(b), c = (c << 5) - c + e, c &= c;
        return c
    };
    a.n = function (a) {
        var c = "0123456789",
            b = "",
            e = "",
            f, g = 8,
            h = 10,
            i = 10;
        if (1 == a) {
            c += "ABCDEF";
            for (a = 0; 16 > a; a++) f =
                Math.floor(Math.random() * g), b += c.substring(f, f + 1), f = Math.floor(Math.random() * g), e += c.substring(f, f + 1), g = 16;
            return b + "-" + e
        }
        for (a = 0; 19 > a; a++) f = Math.floor(Math.random() * h), b += c.substring(f, f + 1), h = 0 == a && 9 == f ? 3 : 10, f = Math.floor(Math.random() * i), e += c.substring(f, f + 1), i = 0 == a && 9 == f ? 3 : 10;
        return b + e
    };
    a.J = function () {
        var a;
        !a && h.location && (a = h.location.hostname);
        if (a)
            if (/^[0-9.]+$/.test(a)) a = "";
            else {
                var c = a.split("."),
                    b = c.length - 1,
                    e = b - 1;
                1 < b && 2 >= c[b].length && 0 > ",ac,ad,ae,af,ag,ai,al,am,an,ao,aq,ar,as,at,au,aw,ax,az,ba,bb,be,bf,bg,bh,bi,bj,bm,bo,br,bs,bt,bv,bw,by,bz,ca,cc,cd,cf,cg,ch,ci,cl,cm,cn,co,cr,cu,cv,cw,cx,cz,de,dj,dk,dm,do,dz,ec,ee,eg,es,eu,fi,fm,fo,fr,ga,gb,gd,ge,gf,gg,gh,gi,gl,gm,gn,gp,gq,gr,gs,gt,gw,gy,hk,hm,hn,hr,ht,hu,id,ie,im,in,io,iq,ir,is,it,je,jo,jp,kg,ki,km,kn,kp,kr,ky,kz,la,lb,lc,li,lk,lr,ls,lt,lu,lv,ly,ma,mc,md,me,mg,mh,mk,ml,mn,mo,mp,mq,mr,ms,mt,mu,mv,mw,mx,my,na,nc,ne,nf,ng,nl,no,nr,nu,om,pa,pe,pf,ph,pk,pl,pm,pn,pr,ps,pt,pw,py,qa,re,ro,rs,ru,rw,sa,sb,sc,sd,se,sg,sh,si,sj,sk,sl,sm,sn,so,sr,st,su,sv,sx,sy,sz,tc,td,tf,tg,th,tj,tk,tl,tm,tn,to,tp,tt,tv,tw,tz,ua,ug,us,uy,uz,va,vc,ve,vg,vi,vn,vu,wf,ws,yt,".indexOf("," +
                    c[b] + ",") && e--;
                if (0 < e)
                    for (a = ""; b >= e;) a = c[b] + (a ? "." : "") + a, b--
            }
        return a
    };
    a.cookieRead = function (a) {
        var a = encodeURIComponent(a),
            c = (";" + o.cookie).split(" ").join(";"),
            b = c.indexOf(";" + a + "="),
            e = 0 > b ? b : c.indexOf(";", b + 1);
        return 0 > b ? "" : decodeURIComponent(c.substring(b + 2 + a.length, 0 > e ? c.length : e))
    };
    a.cookieWrite = function (d, c, b) {
        var e = a.cookieLifetime,
            f, c = "" + c,
            e = e ? ("" + e).toUpperCase() : "";
        b && "SESSION" != e && "NONE" != e ? (f = "" != c ? parseInt(e ? e : 0) : -60) ? (b = new Date, b.setTime(b.getTime() + 1E3 * f)) : 1 == b && (b = new Date, f = b.getYear(),
            b.setYear(f + 2 + (1900 > f ? 1900 : 0))) : b = 0;
        return d && "NONE" != e ? (o.cookie = encodeURIComponent(d) + "=" + encodeURIComponent(c) + "; path=/;" + (b ? " expires=" + b.toGMTString() + ";" : "") + (a.m ? " domain=" + a.m + ";" : ""), a.cookieRead(d) == c) : 0
    };
    a.d = i;
    a.z = function (a, c) {
        try {
            "function" == typeof a ? a.apply(h, c) : a[1].apply(a[0], c)
        } catch (b) {}
    };
    a.M = function (d, c) {
        c && (a.d == i && (a.d = {}), void 0 == a.d[d] && (a.d[d] = []), a.d[d].push(c))
    };
    a.l = function (d, c) {
        if (a.d != i) {
            var b = a.d[d];
            if (b)
                for (; 0 < b.length;) a.z(b.shift(), c)
        }
    };
    a.h = i;
    a.K = function (d, c, b) {
        !c &&
            b && b();
        var e = o.getElementsByTagName("HEAD")[0],
            f = o.createElement("SCRIPT");
        f.type = "text/javascript";
        f.setAttribute("async", "async");
        f.src = c;
        e.firstChild ? e.insertBefore(f, e.firstChild) : e.appendChild(f);
        b && (a.h == i && (a.h = {}), a.h[d] = setTimeout(b, a.loadTimeout))
    };
    a.I = function (d) {
        a.h != i && a.h[d] && (clearTimeout(a.h[d]), a.h[d] = 0)
    };
    a.F = p;
    a.G = p;
    a.isAllowed = function () {
        if (!a.F && (a.F = j, a.cookieRead(a.cookieName) || a.cookieWrite(a.cookieName, "T", 1))) a.G = j;
        return a.G
    };
    a.a = i;
    a.c = i;
    var v = a.W;
    v || (v = "MC");
    var l = a.Y;
    l ||
        (l = "MCMID");
    var w = a.X;
    w || (w = "MCCIDH");
    var t = a.U;
    t || (t = "A");
    var m = a.R;
    m || (m = "MCAID");
    var u = a.V;
    u || (u = "AAM");
    var q = a.T;
    q || (q = "MCAAMLH");
    var n = a.S;
    n || (n = "MCAAMB");
    var r = a.Z;
    r || (r = "NONE");
    a.u = 0;
    a.C = function () {
        if (!a.u) {
            var d = a.version;
            a.customerIDMappingServer && (d += "|" + a.customerIDMappingServer);
            a.customerIDMappingServerSecure && (d += "|" + a.customerIDMappingServerSecure);
            a.audienceManagerServer && (d += "|" + a.audienceManagerServer);
            a.audienceManagerServerSecure && (d += "|" + a.audienceManagerServerSecure);
            if (a.audienceManagerCustomerIDDPIDs)
                for (var c in a.audienceManagerCustomerIDDPIDs)!Object.prototype[c] &&
                    a.audienceManagerCustomerIDDPIDs[c] && (d += c + "=" + a.audienceManagerCustomerIDDPIDs[c]);
            a.u = a.D(d)
        }
        return a.u
    };
    a.H = p;
    a.j = function () {
        if (!a.H) {
            a.H = j;
            var d = a.C(),
                c = p,
                b = a.cookieRead(a.cookieName),
                e, f, g, h = new Date;
            a.a == i && (a.a = {});
            if (b && "T" != b) {
                b = b.split("|");
                b[0].match(/^[\-0-9]+$/) && (parseInt(b[0]) != d && (c = j), b.shift());
                1 == b.length % 2 && b.pop();
                for (d = 0; d < b.length; d += 2) e = b[d].split("-"), f = e[0], g = b[d + 1], e = 1 < e.length ? parseInt(e[1]) : 0, c && (f == w && (g = ""), 0 < e && (e = h.getTime() / 1E3 - 60)), f && g && (a.g(f, g, 1), 0 < e && (a.a["expire" +
                    f] = e, h.getTime() >= 1E3 * e && (a.c || (a.c = {}), a.c[f] = j)))
            }
            if (!a.b(m) && (b = a.cookieRead("s_vi"))) b = b.split("|"), 1 < b.length && 0 <= b[0].indexOf("v1") && (g = b[1], d = g.indexOf("["), 0 <= d && (g = g.substring(0, d)), g && g.match(/^[0-9a-fA-F\-]+$/) && a.g(m, g))
        }
    };
    a.N = function () {
        var d = a.C(),
            c, b;
        for (c in a.a)!Object.prototype[c] && a.a[c] && "expire" != c.substring(0, 6) && (b = a.a[c], d += (d ? "|" : "") + c + (a.a["expire" + c] ? "-" + a.a["expire" + c] : "") + "|" + b);
        a.cookieWrite(a.cookieName, d, 1)
    };
    a.b = function (d, c) {
        return a.a != i && (c || !a.c || !a.c[d]) ? a.a[d] :
            i
    };
    a.g = function (d, c, b) {
        a.a == i && (a.a = {});
        a.a[d] = c;
        b || a.N()
    };
    a.t = function (d, c) {
        var b = new Date;
        b.setTime(b.getTime() + 1E3 * c);
        a.a == i && (a.a = {});
        a.a["expire" + d] = Math.floor(b.getTime() / 1E3);
        0 > c && (a.c || (a.c = {}), a.c[d] = j)
    };
    a.B = function (a) {
        if (a && ("object" == typeof a && (a = a.d_mid ? a.d_mid : a.visitorID ? a.visitorID : a.id ? a.id : a.uuid ? a.uuid : "" + a), a && (a = a.toUpperCase(), "NOTARGET" == a && (a = r)), !a || a != r && !a.match(/^[0-9a-fA-F\-]+$/))) a = "";
        return a
    };
    a.i = function (d, c) {
        a.I(d);
        a.f != i && (a.f[d] = p);
        if (d == v) {
            var b = a.b(l);
            if (!b) {
                b =
                    "object" == typeof c && c.mid ? c.mid : a.B(c);
                if (!b) {
                    if (a.q) {
                        a.getAnalyticsVisitorID(null, !1, !0);
                        return
                    }
                    b = a.n()
                }
                a.g(l, b)
            }
            if (!b || b == r) b = "";
            "object" == typeof c && ((c.d_region || c.dcs_region || c.d_blob || c.blob) && a.i(u, c), a.q && c.mid && a.i(t, {
                id: c.id
            }));
            a.l(l, [b])
        }
        if (d == u && "object" == typeof c) {
            b = 604800;
            void 0 != c.id_sync_ttl && c.id_sync_ttl && (b = parseInt(c.id_sync_ttl));
            var e = a.b(q);
            e || ((e = c.d_region) || (e = c.dcs_region), e && (a.t(q, b), a.g(q, e)));
            e || (e = "");
            a.l(q, [e]);
            e = a.b(n);
            if (c.d_blob || c.blob)(e = c.d_blob) || (e = c.blob),
            a.t(n, b), a.g(n, e);
            e || (e = "");
            a.l(n, [e])
        }
        if (d == t) {
            b = a.b(m);
            b || ((b = a.B(c)) || (b = r), a.g(m, b));
            if (!b || b == r) b = "";
            a.l(m, [b])
        }
    };
    a.f = i;
    a.o = function (d, c, b, e) {
        var f = "",
            g;
        if (a.isAllowed() && (a.j(), f = a.b(d), !f && (d == l ? g = v : d == q || d == n ? g = u : d == m && (g = t), g))) {
            if (a.f == i || !a.f[g]) a.f == i && (a.f = {}), a.f[g] = j, a.K(g, c, function () {
                if (!a.b(d)) {
                    var b = "";
                    d == l && (b = a.n());
                    a.i(g, b)
                }
            });
            a.M(d, b);
            return ""
        }
        if ((d == l || d == m) && f == r) f = "", e = j;
        b && e && a.z(b, [f]);
        return f
    };
    a._setMarketingCloudFields = function (d) {
        a.j();
        a.i(v, d)
    };
    a.setMarketingCloudVisitorID =
        function (d) {
            a._setMarketingCloudFields(d)
    };
    a.q = p;
    a.getMarketingCloudVisitorID = function (d, c) {
        return a.isAllowed() ? (a.marketingCloudServer && 0 > a.marketingCloudServer.indexOf(".demdex.net") && (a.q = j), a.o(l, a.r("_setMarketingCloudFields"), d, c)) : ""
    };
    a._mapCustomerIDsDone = function (d) {
        d && "success" == d.status && a.g(w, a.s)
    };
    a.L = function () {
        a._mapCustomerIDsDone({
            status: "success"
        })
    };
    a.e = {};
    a.A = p;
    a.s = "";
    a.setCustomerIDs = function (d) {
        a.e = d;
        if (a.isAllowed()) {
            a.j();
            var d = a.b(w),
                c = "",
                b, e;
            d || (d = 0);
            for (b in a.e) e = a.e[b], !Object.prototype[b] && e && (c += (c ? "|" : "") + b + "|" + e);
            a.s = a.D(c);
            a.s != d && (a.A = j, a.L())
        }
    };
    a.getCustomerIDs = function () {
        return a.e
    };
    a._setAnalyticsFields = function (d) {
        a.j();
        a.i(t, d)
    };
    a.setAnalyticsVisitorID = function (d) {
        a._setAnalyticsFields(d)
    };
    a.getAnalyticsVisitorID = function (d, c, b) {
        if (a.isAllowed()) {
            var e = "";
            b || (e = a.getMarketingCloudVisitorID(function () {
                a.getAnalyticsVisitorID(d, j)
            }));
            if (e || b) {
                var f = b ? a.marketingCloudServer : a.trackingServer,
                    g = "";
                a.loadSSL && (b ? a.marketingCloudServerSecure && (f = a.marketingCloudServerSecure) :
                    a.trackingServerSecure && (f = a.trackingServerSecure));
                f && (g = "http" + (a.loadSSL ? "s" : "") + "://" + f + "/id?callback=s_c_il%5B" + a._in + "%5D._set" + (b ? "MarketingCloud" : "Analytics") + "Fields&mcorgid=" + encodeURIComponent(a.marketingCloudOrgID) + (e ? "&mid=" + e : ""));
                return a.o(b ? l : m, g, d, c)
            }
        }
        return ""
    };
    a._setAudienceManagerFields = function (d) {
        a.j();
        a.i(u, d)
    };
    a.r = function (d) {
        var c = a.audienceManagerServer,
            b = "",
            e = a.b(l),
            f = a.b(n, j),
            g = "",
            h, i;
        a.loadSSL && a.audienceManagerServerSecure && (c = a.audienceManagerServerSecure);
        if (c) {
            if (a.e &&
                a.audienceManagerCustomerIDDPIDs)
                for (h in a.e) Object.prototype[h] || (b = a.e[h], i = a.audienceManagerCustomerIDDPIDs[h], b && i && (g += (g ? "%01" : "&d_cid=") + i + "%01" + encodeURIComponent(b)));
            d || (d = "_setAudienceManagerFields");
            b = "http" + (a.loadSSL ? "s" : "") + "://" + c + "/id?d_rtbd=json&d_ver=2" + (!e && a.q ? "&d_verify=1" : "") + "&d_orgid=" + encodeURIComponent(a.marketingCloudOrgID) + (e ? "&d_mid=" + e : "") + (f ? "&d_blob=" + encodeURIComponent(f) : "") + g + "&d_cb=s_c_il%5B" + a._in + "%5D." + d
        }
        return b
    };
    a.getAudienceManagerLocationHint = function (d,
        c) {
        return a.isAllowed() && a.getMarketingCloudVisitorID(function () {
            a.getAudienceManagerLocationHint(d, j)
        }) ? a.o(q, a.r(), d, c) : ""
    };
    a.getAudienceManagerBlob = function (d, c) {
        if (a.isAllowed() && a.getMarketingCloudVisitorID(function () {
            a.getAudienceManagerBlob(d, j)
        })) {
            var b = a.r();
            a.A && a.t(n, -1);
            return a.o(n, b, d, c)
        }
        return ""
    };
    a.k = "";
    a.p = {};
    a.v = "";
    a.w = {};
    a.getSupplementalDataID = function (d, c) {
        !a.k && !c && (a.k = a.n(1));
        var b = a.k;
        a.v && !a.w[d] ? (b = a.v, a.w[d] = j) : b && (a.p[d] && (a.v = a.k, a.w = a.p, a.k = b = !c ? a.n(1) : "", a.p = {}), b &&
            (a.p[d] = j));
        return b
    };
    0 > k.indexOf("@") && (k += "@AdobeOrg");
    a.marketingCloudOrgID = k;
    a.namespace = s;
    a.cookieName = "AMCV_" + k;
    a.m = a.J();
    a.m == h.location.hostname && (a.m = "");
    if (s) {
        var x = "AMCV_" + s,
            z = a.cookieRead(a.cookieName),
            y = a.cookieRead(x);
        !z && y && (a.cookieWrite(a.cookieName, y, 1), a.cookieWrite(x, "", -60))
    }
    a.loadSSL = 0 <= h.location.protocol.toLowerCase().indexOf("https");
    a.loadTimeout = 500;
    a.marketingCloudServer = a.audienceManagerServer = "dpm.demdex.net";
    a.customerIDMappingServer = "map.adobecrs.com"
}
Visitor.getInstance = function (k, s) {
    var a, h = window.s_c_il,
        o;
    0 > k.indexOf("@") && (k += "@AdobeOrg");
    if (h)
        for (o = 0; o < h.length; o++)
            if ((a = h[o]) && "Visitor" == a._c && (a.marketingCloudOrgID == k || s && a.namespace == s)) return a;
    return new Visitor(k, s)
};

//Mbox.js v51

var mboxCopyright = "Copyright 1996-2014. Adobe Systems Incorporated. All rights reserved.";
var TNT = TNT || {};
TNT.a = TNT.a || {};
TNT.a.nestedMboxes = [];
TNT.getGlobalMboxName = function () {
    return "target-global-mbox";
};
TNT.getGlobalMboxLocation = function () {
    return "";
};
TNT.isAutoCreateGlobalMbox = function () {
    return true;
};
TNT.a.b = function () {
    var c = {}.toString;
    var d = window.targetPageParams;
    var e = "";
    var f = [];
    if (typeof (d) != 'undefined' && c.call(d) === '[object Function]') {
        try {
            e = d();
        } catch (g) {}
        if (e.length > 0) {
            f = e.split("&");
            for (var i = 0; i < f.length; i++) {
                f[i] = decodeURIComponent(f[i]);
            }
        }
    }
    return f;
};
mboxUrlBuilder = function (h, i) {
    this.h = h;
    this.i = i;
    this.j = new Array();
    this.k = function (l) {
        return l;
    };
    this.m = null;
};
mboxUrlBuilder.prototype.addNewParameter = function (n, o) {
    this.j.push({
        name: n,
        value: o
    });
    return this;
};
mboxUrlBuilder.prototype.addParameterIfAbsent = function (n, o) {
    if (o) {
        for (var p = 0; p < this.j.length; p++) {
            var q = this.j[p];
            if (q.name === n) {
                return this;
            }
        }
        this.checkInvalidCharacters(n);
        return this.addNewParameter(n, o);
    }
};
mboxUrlBuilder.prototype.addParameter = function (n, o) {
    this.checkInvalidCharacters(n);
    for (var p = 0; p < this.j.length; p++) {
        var q = this.j[p];
        if (q.name === n) {
            q.value = o;
            return this;
        }
    }
    return this.addNewParameter(n, o);
};
mboxUrlBuilder.prototype.addParameters = function (j) {
    if (!j) {
        return this;
    }
    for (var p = 0; p < j.length; p++) {
        var r = j[p].indexOf('=');
        if (r == -1 || r == 0) {
            continue;
        }
        this.addParameter(j[p].substring(0, r), j[p].substring(r + 1, j[p].length));
    }
    return this;
};
mboxUrlBuilder.prototype.setServerType = function (s) {
    this.t = s;
};
mboxUrlBuilder.prototype.setBasePath = function (m) {
    this.m = m;
};
mboxUrlBuilder.prototype.setUrlProcessAction = function (u) {
    this.k = u;
};
mboxUrlBuilder.prototype.buildUrl = function () {
    var v = this.m ? this.m : '/m2/' + this.i + '/mbox/' + this.t;
    var w = document.location.protocol == 'file:' ? 'http:' : document.location.protocol;
    var l = w + "//" + this.h + v;
    var x = l.indexOf('?') != -1 ? '&' : '?';
    for (var p = 0; p < this.j.length; p++) {
        var q = this.j[p];
        l += x + encodeURIComponent(q.name) + '=' + encodeURIComponent(q.value);
        x = '&';
    }
    return this.y(this.k(l));
};
mboxUrlBuilder.prototype.getParameters = function () {
    return this.j;
};
mboxUrlBuilder.prototype.setParameters = function (j) {
    this.j = j;
};
mboxUrlBuilder.prototype.clone = function () {
    var z = new mboxUrlBuilder(this.h, this.i);
    z.setServerType(this.t);
    z.setBasePath(this.m);
    z.setUrlProcessAction(this.k);
    for (var p = 0; p < this.j.length; p++) {
        z.addParameter(this.j[p].name, this.j[p].value);
    }
    return z;
};
mboxUrlBuilder.prototype.y = function (A) {
    return A.replace(/\"/g, '&quot;').replace(/>/g, '&gt;');
};
mboxUrlBuilder.prototype.checkInvalidCharacters = function (n) {
    var B = new RegExp('(\'|")');
    if (B.exec(n)) {
        throw "Parameter '" + n + "' contains invalid characters";
    }
};
mboxStandardFetcher = function () {};
mboxStandardFetcher.prototype.getType = function () {
    return 'standard';
};
mboxStandardFetcher.prototype.fetch = function (C) {
    C.setServerType(this.getType());
    document.write('<' + 'scr' + 'ipt src="' + C.buildUrl() + '" language="JavaScript"><' + '\/scr' + 'ipt>');
};
mboxStandardFetcher.prototype.cancel = function () {};
mboxAjaxFetcher = function () {};
mboxAjaxFetcher.prototype.getType = function () {
    return 'ajax';
};
mboxAjaxFetcher.prototype.fetch = function (C) {
    C.setServerType(this.getType());
    var l = C.buildUrl();
    this.D = document.createElement('script');
    this.D.src = l;
    document.body.appendChild(this.D);
};
mboxAjaxFetcher.prototype.cancel = function () {};
mboxMap = function () {
    this.E = new Object();
    this.F = new Array();
};
mboxMap.prototype.put = function (G, o) {
    if (!this.E[G]) {
        this.F[this.F.length] = G;
    }
    this.E[G] = o;
};
mboxMap.prototype.get = function (G) {
    return this.E[G];
};
mboxMap.prototype.remove = function (G) {
    this.E[G] = undefined;
    var H = [];
    for (var i = 0; i < this.F.length; i++) {
        if (this.F[i] !== G) {
            H.push(this.F[i])
        }
    }
    this.F = H;
};
mboxMap.prototype.each = function (u) {
    for (var p = 0; p < this.F.length; p++) {
        var G = this.F[p];
        var o = this.E[G];
        if (o) {
            var I = u(G, o);
            if (I === false) {
                break;
            }
        }
    }
};
mboxMap.prototype.isEmpty = function () {
    return this.F.length === 0;
};
mboxFactory = function (J, i, K) {
    this.L = false;
    this.J = J;
    this.K = K;
    this.M = new mboxList();
    mboxFactories.put(K, this);
    this.N = typeof document.createElement('div').replaceChild != 'undefined' && (function () {
        return true;
    })() && typeof document.getElementById != 'undefined' && typeof (window.attachEvent || document.addEventListener || window.addEventListener) != 'undefined' && typeof encodeURIComponent != 'undefined';
    this.O = this.N && mboxGetPageParameter('mboxDisable') == null;
    var P = K == 'default';
    this.Q = new mboxCookieManager('mbox' + (P ? '' : ('-' + K)), (function () {
        return mboxCookiePageDomain();
    })());
    this.O = this.O && this.Q.isEnabled() && (this.Q.getCookie('disable') == null);
    if (this.isAdmin()) {
        this.enable();
    }
    this.R();
    this.S = mboxGenerateId();
    this.T = mboxScreenHeight();
    this.U = mboxScreenWidth();
    this.V = mboxBrowserWidth();
    this.W = mboxBrowserHeight();
    this.X = mboxScreenColorDepth();
    this.Y = mboxBrowserTimeOffset();
    this.Z = new mboxSession(this.S, 'mboxSession', 'session', 31 * 60, this.Q);
    this._ = new mboxPC('PC', 7776000, this.Q);
    this.C = new mboxUrlBuilder(J, i);
    this.ab(this.C, P);
    this.bb = new Date().getTime();
    this.cb = this.bb;
    var db = this;
    this.addOnLoad(function () {
        db.cb = new Date().getTime();
    });
    if (this.N) {
        this.addOnLoad(function () {
            db.L = true;
            db.getMboxes().each(function (eb) {
                eb.fb();
                eb.setFetcher(new mboxAjaxFetcher());
                eb.finalize();
            });
            TNT.a.nestedMboxes = [];
        });
        if (this.O) {
            this.limitTraffic(100, 10368000);
            this.gb();
            this.hb = new mboxSignaler(function (ib, j) {
                return db.create(ib, j);
            }, this.Q);
        }
    }
};
mboxFactory.prototype.isEnabled = function () {
    return this.O;
};
mboxFactory.prototype.getDisableReason = function () {
    return this.Q.getCookie('disable');
};
mboxFactory.prototype.isSupported = function () {
    return this.N;
};
mboxFactory.prototype.disable = function (jb, kb) {
    if (typeof jb == 'undefined') {
        jb = 60 * 60;
    }
    if (typeof kb == 'undefined') {
        kb = 'unspecified';
    }
    if (!this.isAdmin()) {
        this.O = false;
        this.Q.setCookie('disable', kb, jb);
    }
};
mboxFactory.prototype.enable = function () {
    this.O = true;
    this.Q.deleteCookie('disable');
};
mboxFactory.prototype.isAdmin = function () {
    return document.location.href.indexOf('mboxEnv') != -1;
};
mboxFactory.prototype.limitTraffic = function (lb, jb) {};
mboxFactory.prototype.addOnLoad = function (mb) {
    if (this.isDomLoaded()) {
        mb();
    } else {
        var nb = false;
        var ob = function () {
            if (nb) {
                return;
            }
            nb = true;
            mb();
        };
        this.pb.push(ob);
        if (this.isDomLoaded() && !nb) {
            ob();
        }
    }
};
mboxFactory.prototype.getEllapsedTime = function () {
    return this.cb - this.bb;
};
mboxFactory.prototype.getEllapsedTimeUntil = function (qb) {
    return qb - this.bb;
};
mboxFactory.prototype.getMboxes = function () {
    return this.M;
};
mboxFactory.prototype.get = function (ib, rb) {
    return this.M.get(ib).getById(rb || 0);
};
mboxFactory.prototype.update = function (ib, j) {
    if (!this.isEnabled()) {
        return;
    }
    if (!this.isDomLoaded()) {
        var db = this;
        this.addOnLoad(function () {
            db.update(ib, j);
        });
        return;
    }
    if (this.M.get(ib).length() == 0) {
        throw "Mbox " + ib + " is not defined";
    }
    this.M.get(ib).each(function (eb) {
        eb.getUrlBuilder().addParameter('mboxPage', mboxGenerateId());
        mboxFactoryDefault.setVisitorIdParameters(eb.getUrlBuilder(), ib);
        eb.load(j);
    });
};
mboxFactory.prototype.setVisitorIdParameters = function (l, ib) {
    var imsOrgId = 'F7093025512D2B690A490D44@AdobeOrg';
    if (typeof Visitor == 'undefined' || imsOrgId.length == 0) {
        return;
    }
    var visitor = Visitor.getInstance(imsOrgId);
    if (visitor.isAllowed()) {
        var addVisitorValueToUrl = function (param, getter, mboxName) {
            if (visitor[getter]) {
                var callback = function (value) {
                    if (value) {
                        l.addParameter(param, value);
                    }
                };
                var value;
                if (typeof mboxName != 'undefined') {
                    value = visitor[getter]("mbox:" + mboxName);
                } else {
                    value = visitor[getter](callback);
                }
                callback(value);
            }
        };
        addVisitorValueToUrl('mboxMCGVID', "getMarketingCloudVisitorID");
        addVisitorValueToUrl('mboxMCGLH', "getAudienceManagerLocationHint");
        addVisitorValueToUrl('mboxAAMB', "getAudienceManagerBlob");
        addVisitorValueToUrl('mboxMCAVID', "getAnalyticsVisitorID");
        addVisitorValueToUrl('mboxMCSDID', "getSupplementalDataID", ib);
    }
};
mboxFactory.prototype.create = function (ib, j, sb) {
    if (!this.isSupported()) {
        return null;
    }
    var l = this.C.clone();
    l.addParameter('mboxCount', this.M.length() + 1);
    l.addParameters(j);
    this.setVisitorIdParameters(l, ib);
    var rb = this.M.get(ib).length();
    var tb = this.K + '-' + ib + '-' + rb;
    var ub;
    if (sb) {
        ub = new mboxLocatorNode(sb);
    } else {
        if (this.L) {
            throw 'The page has already been loaded, can\'t write marker';
        }
        ub = new mboxLocatorDefault(tb);
    }
    try {
        var db = this;
        var vb = 'mboxImported-' + tb;
        var eb = new mbox(ib, rb, l, ub, vb);
        if (this.O) {
            eb.setFetcher(this.L ? new mboxAjaxFetcher() : new mboxStandardFetcher());
        }
        eb.setOnError(function (wb, s) {
            eb.setMessage(wb);
            eb.activate();
            if (!eb.isActivated()) {
                db.disable(60 * 60, wb);
                window.location.reload(false);
            }
        });
        this.M.add(eb);
    } catch (xb) {
        this.disable();
        throw 'Failed creating mbox "' + ib + '", the error was: ' + xb;
    }
    var yb = new Date();
    l.addParameter('mboxTime', yb.getTime() - (yb.getTimezoneOffset() * 60000));
    return eb;
};
mboxFactory.prototype.getCookieManager = function () {
    return this.Q;
};
mboxFactory.prototype.getPageId = function () {
    return this.S;
};
mboxFactory.prototype.getPCId = function () {
    return this._;
};
mboxFactory.prototype.getSessionId = function () {
    return this.Z;
};
mboxFactory.prototype.getSignaler = function () {
    return this.hb;
};
mboxFactory.prototype.getUrlBuilder = function () {
    return this.C;
};
mboxFactory.prototype.ab = function (l, P) {
    l.addParameter('mboxHost', document.location.hostname).addParameter('mboxSession', this.Z.getId());
    if (!P) {
        l.addParameter('mboxFactoryId', this.K);
    }
    if (this._.getId() != null) {
        l.addParameter('mboxPC', this._.getId());
    }
    l.addParameter('mboxPage', this.S);
    l.addParameter('screenHeight', this.T);
    l.addParameter('screenWidth', this.U);
    l.addParameter('browserWidth', this.V);
    l.addParameter('browserHeight', this.W);
    l.addParameter('browserTimeOffset', this.Y);
    l.addParameter('colorDepth', this.X);
    l.setUrlProcessAction(function (l) {
        l += '&mboxURL=' + encodeURIComponent(document.location);
        var zb = encodeURIComponent(document.referrer);
        if (l.length + zb.length < 2000) {
            l += '&mboxReferrer=' + zb;
        }
        l += '&mboxVersion=' + mboxVersion;
        return l;
    });
};
mboxFactory.prototype.Ab = function () {
    return "";
};
mboxFactory.prototype.gb = function () {
    document.write('<style>.' + 'mboxDefault' + ' { visibility:hidden; }</style>');
};
mboxFactory.prototype.isDomLoaded = function () {
    return this.L;
};
mboxFactory.prototype.R = function () {
    if (this.pb != null) {
        return;
    }
    this.pb = new Array();
    var db = this;
    (function () {
        var Bb = document.addEventListener ? "DOMContentLoaded" : "onreadystatechange";
        var Cb = false;
        var Db = function () {
            if (Cb) {
                return;
            }
            Cb = true;
            for (var i = 0; i < db.pb.length; ++i) {
                db.pb[i]();
            }
        };
        if (document.addEventListener) {
            document.addEventListener(Bb, function () {
                document.removeEventListener(Bb, arguments.callee, false);
                Db();
            }, false);
            window.addEventListener("load", function () {
                document.removeEventListener("load", arguments.callee, false);
                Db();
            }, false);
        } else if (document.attachEvent) {
            if (self !== self.top) {
                document.attachEvent(Bb, function () {
                    if (document.readyState === 'complete') {
                        document.detachEvent(Bb, arguments.callee);
                        Db();
                    }
                });
            } else {
                var Eb = function () {
                    try {
                        document.documentElement.doScroll('left');
                        Db();
                    } catch (Fb) {
                        setTimeout(Eb, 13);
                    }
                };
                Eb();
            }
        }
        if (document.readyState === "complete") {
            Db();
        }
    })();
};
mboxSignaler = function (Gb, Q) {
    this.Q = Q;
    var Hb = Q.getCookieNames('signal-');
    for (var p = 0; p < Hb.length; p++) {
        var Ib = Hb[p];
        var Jb = Q.getCookie(Ib).split('&');
        var eb = Gb(Jb[0], Jb);
        eb.load();
        Q.deleteCookie(Ib);
    }
};
mboxSignaler.prototype.signal = function (Kb, ib) {
    this.Q.setCookie('signal-' + Kb, mboxShiftArray(arguments).join('&'), 45 * 60);
};
mboxList = function () {
    this.M = new Array();
};
mboxList.prototype.add = function (eb) {
    if (eb != null) {
        this.M[this.M.length] = eb;
    }
};
mboxList.prototype.get = function (ib) {
    var I = new mboxList();
    for (var p = 0; p < this.M.length; p++) {
        var eb = this.M[p];
        if (eb.getName() == ib) {
            I.add(eb);
        }
    }
    return I;
};
mboxList.prototype.getById = function (Lb) {
    return this.M[Lb];
};
mboxList.prototype.length = function () {
    return this.M.length;
};
mboxList.prototype.each = function (u) {
    if (typeof u !== 'function') {
        throw 'Action must be a function, was: ' + typeof (u);
    }
    for (var p = 0; p < this.M.length; p++) {
        u(this.M[p]);
    }
};
mboxLocatorDefault = function (n) {
    this.n = 'mboxMarker-' + n;
    document.write('<div id="' + this.n + '" style="visibility:hidden;display:none">&nbsp;</div>');
};
mboxLocatorDefault.prototype.locate = function () {
    var Mb = document.getElementById(this.n);
    while (Mb != null) {
        if (Mb.nodeType == 1) {
            if (Mb.className == 'mboxDefault') {
                return Mb;
            }
        }
        Mb = Mb.previousSibling;
    }
    return null;
};
mboxLocatorDefault.prototype.force = function () {
    var Nb = document.createElement('div');
    Nb.className = 'mboxDefault';
    var Ob = document.getElementById(this.n);
    if (Ob) {
        Ob.parentNode.insertBefore(Nb, Ob);
    }
    return Nb;
};
mboxLocatorNode = function (Pb) {
    this.Mb = Pb;
};
mboxLocatorNode.prototype.locate = function () {
    return typeof this.Mb == 'string' ? document.getElementById(this.Mb) : this.Mb;
};
mboxLocatorNode.prototype.force = function () {
    return null;
};
mboxCreate = function (ib) {
    var eb = mboxFactoryDefault.create(ib, mboxShiftArray(arguments));
    if (eb) {
        eb.load();
    }
    return eb;
};
mboxDefine = function (sb, ib) {
    var eb = mboxFactoryDefault.create(ib, mboxShiftArray(mboxShiftArray(arguments)), sb);
    return eb;
};
mboxUpdate = function (ib) {
    mboxFactoryDefault.update(ib, mboxShiftArray(arguments));
};
mbox = function (n, Qb, C, Rb, vb) {
    this.Sb = null;
    this.Tb = 0;
    this.ub = Rb;
    this.vb = vb;
    this.Ub = null;
    this.Vb = new mboxOfferContent();
    this.Nb = null;
    this.C = C;
    this.message = '';
    this.Wb = new Object();
    this.Xb = 0;
    this.Qb = Qb;
    this.n = n;
    this.Yb();
    C.addParameter('mbox', n).addParameter('mboxId', Qb);
    this.Zb = function () {};
    this._b = function () {};
    this.ac = null;
    this.bc = document.documentMode >= 10 && !mboxFactoryDefault.isDomLoaded();
    if (this.bc) {
        this.cc = TNT.a.nestedMboxes;
        this.cc.push(this.n);
    }
};
mbox.prototype.getId = function () {
    return this.Qb;
};
mbox.prototype.Yb = function () {
    if (this.n.length > 250) {
        throw "Mbox Name " + this.n + " exceeds max length of " + "250 characters.";
    } else if (this.n.match(/^\s+|\s+$/g)) {
        throw "Mbox Name " + this.n + " has leading/trailing whitespace(s).";
    }
};
mbox.prototype.getName = function () {
    return this.n;
};
mbox.prototype.getParameters = function () {
    var j = this.C.getParameters();
    var I = new Array();
    for (var p = 0; p < j.length; p++) {
        if (j[p].name.indexOf('mbox') != 0) {
            I[I.length] = j[p].name + '=' + j[p].value;
        }
    }
    return I;
};
mbox.prototype.setOnLoad = function (u) {
    this._b = u;
    return this;
};
mbox.prototype.setMessage = function (wb) {
    this.message = wb;
    return this;
};
mbox.prototype.setOnError = function (Zb) {
    this.Zb = Zb;
    return this;
};
mbox.prototype.setFetcher = function (dc) {
    if (this.Ub) {
        this.Ub.cancel();
    }
    this.Ub = dc;
    return this;
};
mbox.prototype.getFetcher = function () {
    return this.Ub;
};
mbox.prototype.load = function (j) {
    if (this.Ub == null) {
        return this;
    }
    this.setEventTime("load.start");
    this.cancelTimeout();
    this.Tb = 0;
    var C = (j && j.length > 0) ? this.C.clone().addParameters(j) : this.C;
    this.Ub.fetch(C);
    var db = this;
    this.ec = setTimeout(function () {
        db.Zb('browser timeout', db.Ub.getType());
    }, 15000);
    this.setEventTime("load.end");
    return this;
};
mbox.prototype.loaded = function () {
    this.cancelTimeout();
    if (!this.activate()) {
        var db = this;
        setTimeout(function () {
            db.loaded();
        }, 100);
    }
};
mbox.prototype.activate = function () {
    if (this.Tb) {
        return this.Tb;
    }
    this.setEventTime('activate' + ++this.Xb + '.start');
    if (this.bc && this.cc[this.cc.length - 1] !== this.n) {
        return this.Tb;
    }
    if (this.show()) {
        this.cancelTimeout();
        this.Tb = 1;
    }
    this.setEventTime('activate' + this.Xb + '.end');
    if (this.bc) {
        this.cc.pop();
    }
    return this.Tb;
};
mbox.prototype.isActivated = function () {
    return this.Tb;
};
mbox.prototype.setOffer = function (Vb) {
    if (Vb && Vb.show && Vb.setOnLoad) {
        this.Vb = Vb;
    } else {
        throw 'Invalid offer';
    }
    return this;
};
mbox.prototype.getOffer = function () {
    return this.Vb;
};
mbox.prototype.show = function () {
    this.setEventTime('show.start');
    var I = this.Vb.show(this);
    this.setEventTime(I == 1 ? "show.end.ok" : "show.end");
    return I;
};
mbox.prototype.showContent = function (fc) {
    if (fc == null) {
        return 0;
    }
    if (this.Nb == null || !this.Nb.parentNode) {
        this.Nb = this.getDefaultDiv();
        if (this.Nb == null) {
            return 0;
        }
    }
    if (this.Nb != fc) {
        this.gc(this.Nb);
        this.Nb.parentNode.replaceChild(fc, this.Nb);
        this.Nb = fc;
    }
    this.hc(fc);
    this._b();
    return 1;
};
mbox.prototype.hide = function () {
    this.setEventTime('hide.start');
    var I = this.showContent(this.getDefaultDiv());
    this.setEventTime(I == 1 ? 'hide.end.ok' : 'hide.end.fail');
    return I;
};
mbox.prototype.finalize = function () {
    this.setEventTime('finalize.start');
    this.cancelTimeout();
    if (this.getDefaultDiv() == null) {
        if (this.ub.force() != null) {
            this.setMessage('No default content, an empty one has been added');
        } else {
            this.setMessage('Unable to locate mbox');
        }
    }
    if (!this.activate()) {
        this.hide();
        this.setEventTime('finalize.end.hide');
    }
    this.setEventTime('finalize.end.ok');
};
mbox.prototype.cancelTimeout = function () {
    if (this.ec) {
        clearTimeout(this.ec);
    }
    if (this.Ub != null) {
        this.Ub.cancel();
    }
};
mbox.prototype.getDiv = function () {
    return this.Nb;
};
mbox.prototype.getDefaultDiv = function () {
    if (this.ac == null) {
        this.ac = this.ub.locate();
    }
    return this.ac;
};
mbox.prototype.setEventTime = function (ic) {
    this.Wb[ic] = (new Date()).getTime();
};
mbox.prototype.getEventTimes = function () {
    return this.Wb;
};
mbox.prototype.getImportName = function () {
    return this.vb;
};
mbox.prototype.getURL = function () {
    return this.C.buildUrl();
};
mbox.prototype.getUrlBuilder = function () {
    return this.C;
};
mbox.prototype.jc = function (Nb) {
    return Nb.style.display != 'none';
};
mbox.prototype.hc = function (Nb) {
    this.kc(Nb, true);
};
mbox.prototype.gc = function (Nb) {
    this.kc(Nb, false);
};
mbox.prototype.kc = function (Nb, lc) {
    Nb.style.visibility = lc ? "visible" : "hidden";
    Nb.style.display = lc ? "block" : "none";
};
mbox.prototype.fb = function () {
    this.bc = false;
};
mboxOfferContent = function () {
    this._b = function () {};
};
mboxOfferContent.prototype.show = function (eb) {
    var I = eb.showContent(document.getElementById(eb.getImportName()));
    if (I == 1) {
        this._b();
    }
    return I;
};
mboxOfferContent.prototype.setOnLoad = function (_b) {
    this._b = _b;
};
mboxOfferAjax = function (fc) {
    this.fc = fc;
    this._b = function () {};
};
mboxOfferAjax.prototype.setOnLoad = function (_b) {
    this._b = _b;
};
mboxOfferAjax.prototype.show = function (eb) {
    var mc = document.createElement('div');
    mc.id = eb.getImportName();
    mc.innerHTML = this.fc;
    var I = eb.showContent(mc);
    if (I == 1) {
        this._b();
    }
    return I;
};
mboxOfferDefault = function () {
    this._b = function () {};
};
mboxOfferDefault.prototype.setOnLoad = function (_b) {
    this._b = _b;
};
mboxOfferDefault.prototype.show = function (eb) {
    var I = eb.hide();
    if (I == 1) {
        this._b();
    }
    return I;
};
mboxCookieManager = function mboxCookieManager(n, nc) {
    this.n = n;
    this.nc = nc == '' || nc.indexOf('.') == -1 ? '' : '; domain=' + nc;
    this.oc = new mboxMap();
    this.loadCookies();
};
mboxCookieManager.prototype.isEnabled = function () {
    this.setCookie('check', 'true', 60);
    this.loadCookies();
    return this.getCookie('check') == 'true';
};
mboxCookieManager.prototype.setCookie = function (n, o, jb) {
    if (typeof n != 'undefined' && typeof o != 'undefined' && typeof jb != 'undefined') {
        var pc = new Object();
        pc.name = n;
        pc.value = escape(o);
        pc.expireOn = Math.ceil(jb + new Date().getTime() / 1000);
        this.oc.put(n, pc);
        this.saveCookies();
    }
};
mboxCookieManager.prototype.getCookie = function (n) {
    var pc = this.oc.get(n);
    return pc ? unescape(pc.value) : null;
};
mboxCookieManager.prototype.deleteCookie = function (n) {
    this.oc.remove(n);
    this.saveCookies();
};
mboxCookieManager.prototype.getCookieNames = function (qc) {
    var rc = new Array();
    this.oc.each(function (n, pc) {
        if (n.indexOf(qc) == 0) {
            rc[rc.length] = n;
        }
    });
    return rc;
};
mboxCookieManager.prototype.saveCookies = function () {
    var sc = false;
    var tc = 'disable';
    var uc = new Array();
    var vc = 0;
    this.oc.each(function (n, pc) {
        if (!sc || n === tc) {
            uc[uc.length] = n + '#' + pc.value + '#' + pc.expireOn;
            if (vc < pc.expireOn) {
                vc = pc.expireOn;
            }
        }
    });
    var wc = new Date(vc * 1000);
    document.cookie = this.n + '=' + uc.join('|') + '; expires=' + wc.toGMTString() + '; path=/' + this.nc;
};
mboxCookieManager.prototype.loadCookies = function () {
    this.oc = new mboxMap();
    var xc = document.cookie.indexOf(this.n + '=');
    if (xc != -1) {
        var yc = document.cookie.indexOf(';', xc);
        if (yc == -1) {
            yc = document.cookie.indexOf(',', xc);
            if (yc == -1) {
                yc = document.cookie.length;
            }
        }
        var zc = document.cookie.substring(xc + this.n.length + 1, yc).split('|');
        var Ac = Math.ceil(new Date().getTime() / 1000);
        for (var p = 0; p < zc.length; p++) {
            var pc = zc[p].split('#');
            if (Ac <= pc[2]) {
                var Bc = new Object();
                Bc.name = pc[0];
                Bc.value = pc[1];
                Bc.expireOn = pc[2];
                this.oc.put(Bc.name, Bc);
            }
        }
    }
};
mboxSession = function (Cc, Dc, Ib, Ec, Q) {
    this.Dc = Dc;
    this.Ib = Ib;
    this.Ec = Ec;
    this.Q = Q;
    this.Fc = false;
    this.Qb = typeof mboxForceSessionId != 'undefined' ? mboxForceSessionId : mboxGetPageParameter(this.Dc);
    if (this.Qb == null || this.Qb.length == 0) {
        this.Qb = Q.getCookie(Ib);
        if (this.Qb == null || this.Qb.length == 0) {
            this.Qb = Cc;
            this.Fc = true;
        }
    }
    Q.setCookie(Ib, this.Qb, Ec);
};
mboxSession.prototype.getId = function () {
    return this.Qb;
};
mboxSession.prototype.forceId = function (Gc) {
    this.Qb = Gc;
    this.Q.setCookie(this.Ib, this.Qb, this.Ec);
};
mboxPC = function (Ib, Ec, Q) {
    this.Ib = Ib;
    this.Ec = Ec;
    this.Q = Q;
    this.Qb = typeof mboxForcePCId != 'undefined' ? mboxForcePCId : Q.getCookie(Ib);
    if (this.Qb != null) {
        Q.setCookie(Ib, this.Qb, Ec);
    }
};
mboxPC.prototype.getId = function () {
    return this.Qb;
};
mboxPC.prototype.forceId = function (Gc) {
    if (this.Qb != Gc) {
        this.Qb = Gc;
        this.Q.setCookie(this.Ib, this.Qb, this.Ec);
        return true;
    }
    return false;
};
mboxGetPageParameter = function (n) {
    var I = null;
    var Hc = new RegExp("\\?[^#]*" + n + "=([^\&;#]*)");
    var Ic = Hc.exec(document.location);
    if (Ic != null && Ic.length >= 2) {
        I = Ic[1];
    }
    return I;
};
mboxSetCookie = function (n, o, jb) {
    return mboxFactoryDefault.getCookieManager().setCookie(n, o, jb);
};
mboxGetCookie = function (n) {
    return mboxFactoryDefault.getCookieManager().getCookie(n);
};
mboxCookiePageDomain = function () {
    var nc = (/([^:]*)(:[0-9]{0,5})?/).exec(document.location.host)[1];
    var Jc = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/;
    if (!Jc.exec(nc)) {
        var Kc = (/([^\.]+\.[^\.]{3}|[^\.]+\.[^\.]+\.[^\.]{2})$/).exec(nc);
        if (Kc) {
            nc = Kc[0];
            if (nc.indexOf("www.") == 0) {
                nc = nc.substr(4);
            }
        }
    }
    return nc ? nc : "";
};
mboxShiftArray = function (Lc) {
    var I = new Array();
    for (var p = 1; p < Lc.length; p++) {
        I[I.length] = Lc[p];
    }
    return I;
};
mboxGenerateId = function () {
    return (new Date()).getTime() + "-" + Math.floor(Math.random() * 999999);
};
mboxScreenHeight = function () {
    return screen.height;
};
mboxScreenWidth = function () {
    return screen.width;
};
mboxBrowserWidth = function () {
    return (window.innerWidth) ? window.innerWidth : document.documentElement ? document.documentElement.clientWidth : document.body.clientWidth;
};
mboxBrowserHeight = function () {
    return (window.innerHeight) ? window.innerHeight : document.documentElement ? document.documentElement.clientHeight : document.body.clientHeight;
};
mboxBrowserTimeOffset = function () {
    return -new Date().getTimezoneOffset();
};
mboxScreenColorDepth = function () {
    return screen.pixelDepth;
};
if (typeof mboxVersion == 'undefined') {
    var mboxVersion = 51;
    var mboxFactories = new mboxMap();
    var mboxFactoryDefault = new mboxFactory('condenast.tt.omtrdc.net', 'condenast', 'default');
};
if (mboxGetPageParameter("mboxDebug") != null || mboxFactoryDefault.getCookieManager().getCookie("debug") != null) {
    setTimeout(function () {
        if (typeof mboxDebugLoaded == 'undefined') {
            alert('Could not load the remote debug.\nPlease check your connection' + ' to Test&amp;Target servers');
        }
    }, 60 * 60);
    document.write('<' + 'scr' + 'ipt language="Javascript1.2" src=' + '"//admin3.testandtarget.omniture.com/admin/mbox/mbox_debug.jsp?mboxServerHost=condenast.tt.omtrdc.net' + '&clientCode=condenast"><' + '\/scr' + 'ipt>');
};
mboxScPluginFetcher = function (i, Mc) {
    this.i = i;
    this.Mc = Mc;
};
mboxScPluginFetcher.prototype.Nc = function (C) {
    C.setBasePath('/m2/' + this.i + '/sc/standard');
    this.Oc(C);
    var l = C.buildUrl();
    l += '&scPluginVersion=1';
    return l;
};
mboxScPluginFetcher.prototype.Oc = function (C) {
    var Pc = ["dynamicVariablePrefix", "visitorID", "vmk", "ppu", "charSet", "visitorNamespace", "cookieDomainPeriods", "cookieLifetime", "pageName", "currencyCode", "variableProvider", "channel", "server", "pageType", "transactionID", "purchaseID", "campaign", "state", "zip", "events", "products", "linkName", "linkType", "resolution", "colorDepth", "javascriptVersion", "javaEnabled", "cookiesEnabled", "browserWidth", "browserHeight", "connectionType", "homepage", "pe", "pev1", "pev2", "pev3", "visitorSampling", "visitorSamplingGroup", "dynamicAccountSelection", "dynamicAccountList", "dynamicAccountMatch", "trackDownloadLinks", "trackExternalLinks", "trackInlineStats", "linkLeaveQueryString", "linkDownloadFileTypes", "linkExternalFilters", "linkInternalFilters", "linkTrackVars", "linkTrackEvents", "linkNames", "lnk", "eo"];
    for (var p = 0; p < Pc.length; p++) {
        this.Qc(Pc[p], C);
    }
    for (var p = 1; p <= 75; p++) {
        this.Qc('prop' + p, C);
        this.Qc('eVar' + p, C);
        this.Qc('hier' + p, C);
    }
};
mboxScPluginFetcher.prototype.Qc = function (n, C) {
    var o = this.Mc[n];
    if (typeof (o) === 'undefined' || o === null || o === '') {
        return;
    }
    C.addParameter(n, o);
};
mboxScPluginFetcher.prototype.cancel = function () {};
mboxScPluginFetcher.prototype.fetch = function (C) {
    C.setServerType(this.getType());
    var l = this.Nc(C);
    this.D = document.createElement('script');
    this.D.src = l;
    document.body.appendChild(this.D);
};
mboxScPluginFetcher.prototype.getType = function () {
    return 'ajax';
};

function mboxLoadSCPlugin(Mc) {
    if (!Mc) {
        return null;
    }
    Mc.m_tt = function (Mc) {
        var Rc = Mc.m_i('tt');
        Rc.O = true;
        Rc.i = 'condenast';
        Rc['_t'] = function () {
            if (!this.isEnabled()) {
                return;
            }
            var eb = this.Tc();
            if (eb) {
                var dc = new mboxScPluginFetcher(this.i, this.s);
                eb.setFetcher(dc);
                eb.load();
            }
        };
        Rc.isEnabled = function () {
            return this.O && mboxFactoryDefault.isEnabled();
        };
        Rc.Tc = function () {
            var ib = this.Uc();
            var Nb = document.createElement('DIV');
            return mboxFactoryDefault.create(ib, new Array(), Nb);
        };
        Rc.Uc = function () {
            var Vc = this.s.events && this.s.events.indexOf('purchase') != -1;
            return 'SiteCatalyst: ' + (Vc ? 'purchase' : 'event');
        };
    };
    return Mc.loadModule('tt');
};
mboxVizTargetUrl = function (ib) {
    if (!mboxFactoryDefault.isEnabled()) {
        return;
    }
    var C = mboxFactoryDefault.getUrlBuilder().clone();
    C.setBasePath('/m2/' + 'condenast' + '/viztarget');
    C.addParameter('mbox', ib);
    C.addParameter('mboxId', 0);
    C.addParameter('mboxCount', mboxFactoryDefault.getMboxes().length() + 1);
    var yb = new Date();
    C.addParameter('mboxTime', yb.getTime() - (yb.getTimezoneOffset() * 60000));
    C.addParameter('mboxPage', mboxGenerateId());
    var j = mboxShiftArray(arguments);
    if (j && j.length > 0) {
        C.addParameters(j);
    }
    C.addParameter('mboxDOMLoaded', mboxFactoryDefault.isDomLoaded());
    mboxFactoryDefault.setVisitorIdParameters(C, ib);
    return C.buildUrl();
};
TNT.createGlobalMbox = function () {
    var Wc = "target-global-mbox";
    var Xc = ("".length === 0);
    var Yc = "";
    var Zc;
    if (Xc) {
        Yc = "mbox-" + Wc + "-" + mboxGenerateId();
        Zc = document.createElement("div");
        Zc.className = "mboxDefault";
        Zc.id = Yc;
        Zc.style.visibility = "hidden";
        Zc.style.display = "none";
        mboxFactoryDefault.addOnLoad(function () {
            document.body.insertBefore(Zc, document.body.firstChild);
        });
    }
    var _c = mboxFactoryDefault.create(Wc, TNT.a.b(), Yc);
    if (_c != null) {
        _c.load();
    }
};
document.write('<script src="' + document.location.protocol + '//cdn.tt.omtrdc.net/cdn/target.js"></script>');


function aam_tnt_cb() {
    if (typeof arguments[0].stuff != "undefined" && arguments[0].stuff != "") {
        for (var e = 0; e < arguments[0].stuff.length; e++) {
            if (arguments[0].stuff[e].cn == "aam_tnt") {
                if (arguments[0].stuff[0].cv.split(",")) {
                    demdex_raw = arguments[0].stuff[e].cv.split('"');
                    var t = mboxFactoryDefault.getUrlBuilder();
                    t.addParameters(demdex_raw)
                }
            }
        }
    }
    TNT.createGlobalMbox();
}


mboxScPluginFetcher.prototype.Qc = function (n, C) {
    var o = this.Mc[n];
    if (typeof (o) === 'undefined' || o === null || o === '') {
        return;
    }
    if (!n.match("^(linkInternalFilters|linkTrackVars|linkTrackEvents|linkDownloadFileTypes|visitorNamespace|javascriptVersion|javaEnabled|cookiesEnabled|trackDownloadLinks|linkLeaveQueryString|prop47|prop48|prop3)$"))
        C.addParameter(n, o);
};
document.write('<script type="text/javascript" src="//condenast.demdex.net/event?d_stuff=1&d_dst=1&d_rtbd=json&d_cts=1&d_cb=aam_tnt_cb"></script>')