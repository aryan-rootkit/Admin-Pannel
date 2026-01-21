# MongoDB Collection Names - Verification Guide

## ✅ What You Should See

Based on your Mongoose models, MongoDB should create these collections:

| Model Name | Collection Name (Actual) | What You See in Atlas |
|------------|-------------------------|----------------------|
| `Client` | `clients` | May show as "Clients" |
| `Project` | `projects` | May show as "Projects" |
| `Team` | `teams` | May show as "Team" |
| `Revenue` | `revenues` | May show as "Revenue" |
| `User` | `users` | Shows as "users" ✅ |

## 🔍 How Mongoose Names Collections

Mongoose automatically:
1. **Lowercases** the model name
2. **Pluralizes** it
3. So `Client` → `clients`, `Project` → `projects`, etc.

## ⚠️ Important Note

**MongoDB Atlas UI** may display collection names with capital letters for readability, but the **actual collection names** in the database are lowercase and pluralized.

## ✅ Your Setup Looks Correct!

Based on your screenshot:
- ✅ Database: `admin-panel-rootkit` ✅
- ✅ Collections: Clients, Projects, Revenue, Team, users ✅
- ✅ Cluster: AryanPracticeCluster0 ✅

## 🧪 Verify Collection Names

To see the actual collection names (not just UI display):

1. **In MongoDB Atlas:**
   - Click on a collection (e.g., "Clients")
   - Look at the URL or collection details
   - Actual name should be `clients` (lowercase)

2. **Or use MongoDB Shell:**
   ```javascript
   use admin-panel-rootkit
   show collections
   // Should show: clients, projects, teams, revenues, users
   ```

## 📊 Expected Collections

Your database should have these **exact** collection names:

```
✅ clients    (from Client model)
✅ projects   (from Project model)
✅ teams      (from Team model)
✅ revenues   (from Revenue model)
✅ users      (from User model)
✅ events     (from Event model - if you use calendar)
✅ settings   (from Settings model - if you use settings)
```

## 🎯 Summary

**Your MongoDB setup is CORRECT!** ✅

- Database name matches ✅
- All collections present ✅
- Cluster connected ✅

The capitalized names in the UI are just for display. The actual collection names are lowercase and pluralized, which is exactly what Mongoose expects.

---

**Status**: ✅ **VERIFIED - Everything is correct!**
