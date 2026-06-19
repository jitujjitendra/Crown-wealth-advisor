/**
 * Crown Wealth Advisor - Blog System
 * Handles blog CRUD, approval workflow, and publishing
 * Demo mode: works without Firebase configured
 */
(function() {
  'use strict';

  var BLOG_STATUS = {
    DRAFT: 'draft',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    PUBLISHED: 'published'
  };

  // Demo blogs for testing without Firebase
  var demoBlogs = [
    {
      id: 'demo-blog-1',
      title: 'Why Health Insurance is Essential for Every Family',
      content: '<p>Health insurance provides a financial safety net that protects your family from unexpected medical expenses. With rising healthcare costs, having adequate health coverage is no longer optional but a necessity.</p><h2>Key Benefits</h2><ul><li>Cashless hospitalization at network hospitals</li><li>Coverage for pre and post hospitalization expenses</li><li>Tax benefits under Section 80D</li><li>No-claim bonus for claim-free years</li></ul><p>Start your health insurance planning today with Crown Wealth Advisor.</p>',
      excerpt: 'Understand why health cover matters before medical costs become urgent.',
      category: 'Insurance',
      tags: ['health insurance', 'family', 'medical'],
      featuredImage: '',
      metaDescription: 'Learn why health insurance is essential for every family. Expert guidance from Crown Wealth Advisor.',
      author: 'Crown Wealth Advisor',
      authorId: 'demo-owner-001',
      status: BLOG_STATUS.PUBLISHED,
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-15').toISOString(),
      publishedAt: new Date('2024-01-15').toISOString(),
      views: 245
    },
    {
      id: 'demo-blog-2',
      title: 'Term Insurance vs Endowment Plan - Which is Better?',
      content: '<p>Choosing between term insurance and endowment plans depends on your financial goals and risk appetite. Here is a simple comparison to help you decide.</p><h2>Term Insurance</h2><p>Pure protection at low premiums. Ideal for income replacement coverage.</p><h2>Endowment Plans</h2><p>Combines insurance with savings. Returns are typically lower than mutual funds.</p><p>Consult Crown Wealth Advisor for personalized guidance.</p>',
      excerpt: 'A simple comparison of protection-focused and savings-oriented life policies.',
      category: 'Insurance',
      tags: ['term insurance', 'endowment', 'life insurance'],
      featuredImage: '',
      metaDescription: 'Compare term insurance and endowment plans. Find the right life insurance for your needs.',
      author: 'Crown Wealth Advisor',
      authorId: 'demo-owner-001',
      status: BLOG_STATUS.PUBLISHED,
      createdAt: new Date('2024-01-20').toISOString(),
      updatedAt: new Date('2024-01-20').toISOString(),
      publishedAt: new Date('2024-01-20').toISOString(),
      views: 189
    },
    {
      id: 'demo-blog-3',
      title: 'Home Loan Eligibility Guide',
      content: '<p>Understanding home loan eligibility criteria helps you prepare better documentation and improve your chances of approval.</p><h2>Key Factors</h2><ul><li>Monthly income and existing obligations</li><li>Credit score (750+ preferred)</li><li>Employment stability</li><li>Property value and location</li><li>Age and remaining working years</li></ul><p>Use our EMI calculator to plan your home loan budget.</p>',
      excerpt: 'Learn the broad factors that influence lender eligibility assessment.',
      category: 'Loans',
      tags: ['home loan', 'eligibility', 'credit score'],
      featuredImage: '',
      metaDescription: 'Complete guide to home loan eligibility. Know what lenders look for before applying.',
      author: 'Crown Wealth Advisor',
      authorId: 'demo-owner-001',
      status: BLOG_STATUS.PUBLISHED,
      createdAt: new Date('2024-02-01').toISOString(),
      updatedAt: new Date('2024-02-01').toISOString(),
      publishedAt: new Date('2024-02-01').toISOString(),
      views: 312
    },
    {
      id: 'demo-blog-4',
      title: 'Personal Loan vs Loan Against Property',
      content: '<p>When you need funds, choosing between a personal loan and loan against property depends on the amount needed, urgency, and your risk tolerance.</p><h2>Personal Loan</h2><p>Unsecured, faster processing, higher interest rates (10-18% p.a.)</p><h2>Loan Against Property</h2><p>Secured by property, lower rates (8-12% p.a.), longer tenure, risk of property loss on default.</p>',
      excerpt: 'Compare unsecured and secured borrowing at a high level before deciding.',
      category: 'Loans',
      tags: ['personal loan', 'LAP', 'comparison'],
      featuredImage: '',
      metaDescription: 'Personal Loan vs Loan Against Property comparison. Make an informed borrowing decision.',
      author: 'Crown Wealth Advisor',
      authorId: 'demo-owner-001',
      status: BLOG_STATUS.PENDING,
      createdAt: new Date('2024-02-10').toISOString(),
      updatedAt: new Date('2024-02-10').toISOString(),
      publishedAt: null,
      views: 0
    }
  ];

  function isFirebaseAvailable() {
    return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
  }

  function getDemoBlogs() {
    var stored = localStorage.getItem('cwa_blogs');
    if (stored) {
      try { return JSON.parse(stored); } catch(e) {}
    }
    localStorage.setItem('cwa_blogs', JSON.stringify(demoBlogs));
    return demoBlogs;
  }

  function saveDemoBlogs(blogs) {
    localStorage.setItem('cwa_blogs', JSON.stringify(blogs));
  }

  function generateId() {
    return 'blog-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // CRUD Operations
  function createBlog(blogData, callback) {
    var blog = {
      id: generateId(),
      title: blogData.title || '',
      content: blogData.content || '',
      excerpt: blogData.excerpt || '',
      category: blogData.category || 'General',
      tags: blogData.tags || [],
      featuredImage: blogData.featuredImage || '',
      metaDescription: blogData.metaDescription || '',
      author: blogData.author || 'Admin',
      authorId: blogData.authorId || '',
      status: blogData.status || BLOG_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: null,
      views: 0
    };

    if (!isFirebaseAvailable()) {
      var blogs = getDemoBlogs();
      blogs.unshift(blog);
      saveDemoBlogs(blogs);
      if (callback) callback(null, blog);
      return;
    }

    var db = firebase.firestore();
    db.collection('blogs').add(blog).then(function(docRef) {
      blog.id = docRef.id;
      if (callback) callback(null, blog);
    }).catch(function(err) {
      if (callback) callback(err, null);
    });
  }

  function updateBlog(blogId, updates, callback) {
    updates.updatedAt = new Date().toISOString();

    if (!isFirebaseAvailable()) {
      var blogs = getDemoBlogs();
      var index = blogs.findIndex(function(b) { return b.id === blogId; });
      if (index !== -1) {
        Object.assign(blogs[index], updates);
        saveDemoBlogs(blogs);
        if (callback) callback(null, blogs[index]);
      } else {
        if (callback) callback(new Error('Blog not found'), null);
      }
      return;
    }

    var db = firebase.firestore();
    db.collection('blogs').doc(blogId).update(updates).then(function() {
      if (callback) callback(null, { id: blogId, ...updates });
    }).catch(function(err) {
      if (callback) callback(err, null);
    });
  }

  function deleteBlog(blogId, callback) {
    if (!isFirebaseAvailable()) {
      var blogs = getDemoBlogs();
      blogs = blogs.filter(function(b) { return b.id !== blogId; });
      saveDemoBlogs(blogs);
      if (callback) callback(null);
      return;
    }

    var db = firebase.firestore();
    db.collection('blogs').doc(blogId).delete().then(function() {
      if (callback) callback(null);
    }).catch(function(err) {
      if (callback) callback(err);
    });
  }

  function getBlogs(filters, callback) {
    if (!isFirebaseAvailable()) {
      var blogs = getDemoBlogs();
      if (filters) {
        if (filters.status) {
          blogs = blogs.filter(function(b) { return b.status === filters.status; });
        }
        if (filters.category) {
          blogs = blogs.filter(function(b) { return b.category === filters.category; });
        }
        if (filters.authorId) {
          blogs = blogs.filter(function(b) { return b.authorId === filters.authorId; });
        }
        if (filters.search) {
          var term = filters.search.toLowerCase();
          blogs = blogs.filter(function(b) {
            return b.title.toLowerCase().indexOf(term) !== -1 ||
                   b.excerpt.toLowerCase().indexOf(term) !== -1;
          });
        }
      }
      if (callback) callback(null, blogs);
      return;
    }

    var db = firebase.firestore();
    var query = db.collection('blogs');
    if (filters && filters.status) {
      query = query.where('status', '==', filters.status);
    }
    query.orderBy('createdAt', 'desc').get().then(function(snapshot) {
      var blogs = [];
      snapshot.forEach(function(doc) {
        var data = doc.data();
        data.id = doc.id;
        blogs.push(data);
      });
      if (filters && filters.category) {
        blogs = blogs.filter(function(b) { return b.category === filters.category; });
      }
      if (filters && filters.search) {
        var term = filters.search.toLowerCase();
        blogs = blogs.filter(function(b) {
          return b.title.toLowerCase().indexOf(term) !== -1;
        });
      }
      if (callback) callback(null, blogs);
    }).catch(function(err) {
      if (callback) callback(err, []);
    });
  }

  function getBlogById(blogId, callback) {
    if (!isFirebaseAvailable()) {
      var blogs = getDemoBlogs();
      var blog = blogs.find(function(b) { return b.id === blogId; });
      if (callback) callback(blog ? null : new Error('Not found'), blog);
      return;
    }

    var db = firebase.firestore();
    db.collection('blogs').doc(blogId).get().then(function(doc) {
      if (doc.exists) {
        var data = doc.data();
        data.id = doc.id;
        if (callback) callback(null, data);
      } else {
        if (callback) callback(new Error('Not found'), null);
      }
    }).catch(function(err) {
      if (callback) callback(err, null);
    });
  }

  // Approval workflow
  function approveBlog(blogId, callback) {
    updateBlog(blogId, {
      status: BLOG_STATUS.APPROVED,
      publishedAt: new Date().toISOString()
    }, callback);
  }

  function rejectBlog(blogId, reason, callback) {
    updateBlog(blogId, {
      status: BLOG_STATUS.REJECTED,
      rejectionReason: reason || ''
    }, callback);
  }

  function publishBlog(blogId, callback) {
    updateBlog(blogId, {
      status: BLOG_STATUS.PUBLISHED,
      publishedAt: new Date().toISOString()
    }, callback);
  }

  // Get published blogs for the public blog page
  function getPublishedBlogs(callback) {
    getBlogs({ status: BLOG_STATUS.PUBLISHED }, function(err, blogs) {
      if (!err && blogs.length === 0) {
        // Also include approved blogs
        getBlogs({ status: BLOG_STATUS.APPROVED }, function(err2, approvedBlogs) {
          if (callback) callback(null, approvedBlogs || []);
        });
      } else {
        if (callback) callback(err, blogs);
      }
    });
  }

  // Expose globally
  window.CWA_BlogSystem = {
    BLOG_STATUS: BLOG_STATUS,
    createBlog: createBlog,
    updateBlog: updateBlog,
    deleteBlog: deleteBlog,
    getBlogs: getBlogs,
    getBlogById: getBlogById,
    approveBlog: approveBlog,
    rejectBlog: rejectBlog,
    publishBlog: publishBlog,
    getPublishedBlogs: getPublishedBlogs,
    isFirebaseAvailable: isFirebaseAvailable
  };
})();
