# AI Assistant Rules & Restrictions

## 🚨 CRITICAL RESTRICTIONS

### **NEVER DO THESE THINGS:**

#### **1. API Behavior Changes**
- **NEVER** remove error conditions that are intentional design decisions
- **NEVER** change API responses from errors to success without explicit permission
- **NEVER** modify core business logic without understanding the full context
- **ALWAYS** ask "Is this error intentional?" before "fixing" it

#### **2. Feature Reversion**
- **NEVER** remove features that were recently implemented
- **NEVER** revert working functionality to "make it work"
- **ALWAYS** understand WHY something was implemented before changing it
- **ALWAYS** ask "Should I change this or fix the client instead?"

#### **3. Quick Fixes**
- **NEVER** make changes that break the intended architecture
- **NEVER** prioritize "making it work" over maintaining design integrity
- **ALWAYS** consider the broader system impact
- **ALWAYS** ask "What was the original intent here?"

#### **4. Error Handling**
- **NEVER** treat intentional errors as bugs
- **NEVER** remove validation that serves a purpose
- **ALWAYS** distinguish between "broken" and "working as designed"
- **ALWAYS** ask "Is this error supposed to happen?"

### **✅ ALWAYS DO THESE THINGS:**

#### **1. Context Analysis**
- **ALWAYS** read the full conversation history before making changes
- **ALWAYS** understand the original requirements and design decisions
- **ALWAYS** ask "What was the intended behavior here?"
- **ALWAYS** consider the user's goals, not just the immediate problem

#### **2. Client-Side Solutions First**
- **ALWAYS** try to fix the client before changing the API
- **ALWAYS** improve UX rather than removing validation
- **ALWAYS** maintain the server's contract and expectations
- **ALWAYS** ask "Can I fix this on the client side?"

#### **3. Validation Questions**
- **ALWAYS** ask "Is this error intentional?"
- **ALWAYS** ask "Should I change the API or the client?"
- **ALWAYS** ask "What was the original design intent?"
- **ALWAYS** ask "Will this break other functionality?"

#### **4. Incremental Changes**
- **ALWAYS** make the smallest change that fixes the problem
- **ALWAYS** preserve existing functionality
- **ALWAYS** test assumptions before making changes
- **ALWAYS** ask "What's the minimal fix here?"

## 🎯 PROJECT-SPECIFIC RULES

### **Location-Based Filtering is Sacred**
- The `/api/sales` endpoint MUST require lat/lng parameters
- 400 errors for missing location are CORRECT behavior
- Never remove location validation from the API
- Always fix client-side UX instead of breaking API contracts

### **Error Responses are Intentional**
- 400 errors for missing required parameters are working as designed
- 500 errors for database failures are appropriate
- Never change error responses to success without explicit permission

### **Architecture Preservation**
- Location-based filtering is a core feature, not a bug
- PostGIS fallback with degraded mode is intentional
- Distance-based results are required, not optional

## 🔍 PRE-CHANGE CHECKLIST

Before making ANY change, ask:

- [ ] Is this change preserving the location-based filtering design?
- [ ] Am I fixing the client or breaking the API?
- [ ] Was this "error" actually intentional behavior?
- [ ] Will this change break the core requirements?
- [ ] Am I making the smallest possible change?
- [ ] Have I read the full conversation context?

## 💡 KEY PRINCIPLE

**"Fix the client, not the API, unless the API is genuinely broken."**

The location requirement was working correctly - the issue was that the client wasn't handling the 400 error properly. The solution was to improve the UX, not remove the validation.

## 📚 Examples of What NOT to Do

### ❌ BAD: Removing Location Requirement
```typescript
// DON'T DO THIS - removes intentional validation
if (!lat || !lng) {
  return NextResponse.json({ data: allSales }) // WRONG!
}
```

### ✅ GOOD: Client-Side UX Improvement
```typescript
// DO THIS - improve client handling
if (!filters.lat || !filters.lng) {
  setSales([])
  setLoading(false)
  return // Show location prompt
}
```

## 🚀 Remember

- **Read the full context** before making changes
- **Understand the design intent** before modifying anything
- **Fix the client, not the API** unless the API is genuinely broken
- **Preserve the architecture** that was intentionally built
- **Make minimal changes** that solve the problem without breaking other functionality
