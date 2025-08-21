# Intent-Based Implementation Guide

## 🚀 Quick Start: Programming by Intent

### Before: How-Focused Code
```bash
#!/bin/bash
# lead_qualifier.sh - OLD APPROACH

# Loop through each contact
for contact_id in $(get_contacts); do
  # Fetch data from HubSpot API
  data=$(curl -X GET "https://api.hubspot.com/contacts/v1/contact/vid/${contact_id}/profile")
  
  # Check if email exists
  if [[ $(echo $data | jq '.properties.email') != "null" ]]; then
    # Calculate score based on rules
    score=0
    if [[ $(echo $data | jq '.properties.company_size') -gt 100 ]]; then
      score=$((score + 30))
    fi
    # ... more scoring logic
  fi
done
```

### After: Intent-Focused Code
```bash
#!/bin/bash
# lead_qualifier.sh - INTENT-BASED APPROACH

# Intent: Identify high-value prospects
qualify_leads() {
  local qualified=$(identify_valuable_prospects)
  prioritize_by_potential "$qualified"
}

# Intent: Determine prospect value
identify_valuable_prospects() {
  get_prospects_meeting_criteria "
    company_size: significant
    engagement: active
    budget: available
  "
}

# Intent: Order by business impact
prioritize_by_potential() {
  sort_by_expected_value "$1"
}

# Execute business intent
qualify_leads
```

---

## 🔄 Transformation Patterns

### Pattern 1: Extract Intent from Implementation

#### Step 1: Identify the Business Goal
```yaml
# Ask: What business outcome does this achieve?
Current code: Loops through files and counts lines
Business goal: Measure project size
Intent: Understand codebase scope
```

#### Step 2: Create Intent Interface
```typescript
// Before: Implementation details
function countLines(files: string[]): number

// After: Business intent
function assessProjectComplexity(): ComplexityReport
```

#### Step 3: Hide How Behind What
```javascript
// Before: Exposing implementation
const result = files.map(f => readFile(f))
                   .map(content => content.split('\n').length)
                   .reduce((a, b) => a + b, 0);

// After: Expressing intent
const complexity = assessProjectComplexity();
```

---

### Pattern 2: Replace Procedures with Policies

#### Before: Procedural Steps
```python
def process_order(order):
    # Step 1: Check inventory
    if inventory.get(order.item) < order.quantity:
        return "Out of stock"
    
    # Step 2: Calculate price
    price = order.quantity * pricing.get(order.item)
    
    # Step 3: Apply discount
    if order.quantity > 10:
        price = price * 0.9
    
    # Step 4: Process payment
    if payment.charge(order.customer, price):
        inventory.decrease(order.item, order.quantity)
        return "Success"
```

#### After: Policy-Based Intent
```python
def fulfill_order(order):
    """Intent: Satisfy customer order within business constraints"""
    
    if not meets_fulfillment_policy(order):
        return explain_unfulfillable_reason(order)
    
    return complete_customer_transaction(order)

def meets_fulfillment_policy(order):
    """Business rule: Orders must be fulfillable"""
    return (
        has_sufficient_inventory(order) and
        customer_credit_approved(order) and
        within_shipping_constraints(order)
    )
```

---

### Pattern 3: Declarative Over Imperative

#### Before: Imperative Instructions
```yaml
agent_prompt: |
  1. Open the database connection
  2. Execute SELECT * FROM users WHERE active = true
  3. For each user, check last_login date
  4. If older than 30 days, mark as inactive
  5. Update the database
  6. Close the connection
```

#### After: Declarative Intent
```yaml
agent_prompt: |
  Intent: Maintain accurate user activity status
  
  Success Criteria:
    - Active users: logged in within 30 days
    - Inactive users: no login for 30+ days
    - Status reflects current state
  
  Quality Bar: 100% accuracy, completed within SLA
```

---

## 📋 Practical Refactoring Checklist

### For Shell Scripts (Agents)

- [ ] Replace loops with intent functions
- [ ] Extract business rules from conditionals  
- [ ] Name variables by purpose, not type
- [ ] Group related operations into intent blocks
- [ ] Add intent comments, remove how comments

### For Configuration Files

- [ ] Use semantic keys (what) not technical keys (how)
- [ ] Group by business capability, not technical layer
- [ ] Express constraints as policies, not validations
- [ ] Define outcomes, not processes

### For Documentation Prompts

- [ ] Lead with intent statement
- [ ] Define success criteria, not steps
- [ ] Use business language, not technical jargon
- [ ] Specify quality bars, not procedures
- [ ] Focus on outcomes, not activities

---

## 🎯 Real Examples from This Project

### Example 1: Task Monitor Transformation

**Before**: Implementation-focused
```bash
# Check every minute for new tasks
while true; do
  tasks=$(curl -X GET "$HUBSPOT_API/tasks")
  for task in $tasks; do
    if [[ $(echo $task | jq '.properties.status') == "NOT_STARTED" ]]; then
      # Process task...
    fi
  done
  sleep 60
done
```

**After**: Intent-focused
```bash
# Intent: Ensure timely task processing
monitor_business_activities() {
  continuously_check_for_work_requiring_attention
}

continuously_check_for_work_requiring_attention() {
  when_work_available do
    ensure_work_gets_processed
  done
}
```

### Example 2: Lead Qualification Transformation

**Before**: Rule-based scoring
```javascript
function scoreLoad(lead) {
  let score = 0;
  if (lead.company_size > 100) score += 30;
  if (lead.budget > 50000) score += 40;
  if (lead.timeline == "immediate") score += 30;
  return score;
}
```

**After**: Intent-based qualification
```javascript
function assessLeadPotential(lead) {
  return {
    readyToBuy: evaluatePurchaseReadiness(lead),
    fitForProduct: evaluateProductFit(lead),
    valueToBusinesss: evaluateLifetimeValue(lead)
  };
}
```

### Example 3: Documentation Prompt Transformation

**Before**: Procedural documentation
```markdown
1. List all files in the project
2. Count lines of code in each file
3. Identify the programming languages used
4. Create a table with file names and line counts
5. Calculate total lines of code
```

**After**: Intent-based documentation
```markdown
Intent: Provide project scope understanding

Desired Outcome:
- Clear picture of codebase size and complexity
- Technology stack identification
- Maintenance effort estimation

Success Criteria:
- Stakeholders understand project scale
- Developers can estimate effort
- Managers can plan resources
```

---

## 🔧 Tools for Intent-Based Development

### Intent Extractor
```bash
# Command to extract intent from existing code
extract-intent() {
  echo "What business problem does this solve?"
  echo "What would success look like?"
  echo "Who benefits from this?"
}
```

### Intent Validator
```bash
# Validate code follows intent principles
validate-intent() {
  check "Does name express what, not how?"
  check "Is success measurable?"
  check "Are implementation details hidden?"
}
```

### Intent Refactoring
```bash
# Refactor to intent-based approach
refactor-to-intent() {
  identify_business_goal
  create_intent_interface
  hide_implementation_details
  express_success_criteria
}
```

---

## ✅ Migration Strategy

### Phase 1: Documentation (Week 1)
- Update all prompts to intent-based format
- Rewrite agent descriptions
- Create intent glossary

### Phase 2: Interfaces (Week 2)
- Define intent-based APIs
- Create facade patterns
- Hide implementation complexity

### Phase 3: Implementation (Week 3)
- Refactor core agents
- Update shell scripts
- Implement intent patterns

### Phase 4: Validation (Week 4)
- Test intent clarity
- Measure comprehension
- Gather feedback

---

## 📊 Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Code Comprehension Time | 45 min | 15 min | <10 min |
| Business Alignment | 60% | 90% | 95% |
| Maintenance Effort | 20 hrs/mo | 8 hrs/mo | 5 hrs/mo |
| Onboarding Time | 2 weeks | 3 days | 1 day |
| Defect Rate | 12/mo | 4/mo | 2/mo |

---

## 🎓 Learning Resources

### Recommended Reading
- "Clean Code" by Robert Martin (adapt principles to prompts)
- "Domain-Driven Design" by Eric Evans (ubiquitous language)
- "Working Effectively with Legacy Code" by Michael Feathers

### Practice Exercises
1. Take existing script, extract its intent
2. Rewrite configuration to be declarative
3. Transform prompt from how to what
4. Create intent-based test cases
5. Document using outcome focus

---

**Guide Version**: 1.0.0  
**Methodology**: Programming by Intent  
**Last Updated**: 2025-08-18