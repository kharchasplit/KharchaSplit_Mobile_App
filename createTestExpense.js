/**
 * Test function to create an expense that generates settlements
 * This creates an expense where one person pays the full amount for multiple people
 */

import { firebaseService } from './src/services/firebaseService.ts';

const createTestExpense = async (groupId, currentUserId, groupMembers) => {
  try {
    // Example: Create a ₹300 dinner expense paid by current user
    const testExpense = {
      groupId: groupId,
      description: "Test Dinner - Settlement Generator",
      amount: 300,
      category: {
        id: 1,
        name: "Food",
        emoji: "🍽️",
        color: "#FEF3C7"
      },
      paidBy: {
        id: currentUserId,
        name: "You", // Current user pays the full amount
        isYou: true
      },
      splitType: "Equal",
      participants: [
        // All 3 members participate, but only 1 person (currentUserId) paid
        {
          id: groupMembers[0].userId, // User A
          name: groupMembers[0].name,
          amount: 100, // Each person's share: 300/3 = 100
          isYou: groupMembers[0].userId === currentUserId
        },
        {
          id: groupMembers[1].userId, // User B
          name: groupMembers[1].name,
          amount: 100,
          isYou: groupMembers[1].userId === currentUserId
        },
        {
          id: groupMembers[2].userId, // User C
          name: groupMembers[2].name,
          amount: 100,
          isYou: groupMembers[2].userId === currentUserId
        }
      ],
      createdAt: new Date().toISOString(),
      createdBy: currentUserId,
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    // Create the expense
    const createdExpense = await firebaseService.createGroupExpense(groupId, testExpense);
    
    console.log('✅ Test expense created successfully!');
    console.log('💰 Amount: ₹300');
    console.log('👤 Paid by: Current user (You)');
    console.log('👥 Split among: 3 people (₹100 each)');
    console.log('📊 Result: 2 people owe you ₹100 each');
    console.log('🔗 Expense ID:', createdExpense.id);
    
    return createdExpense;
  } catch (error) {
    console.error('❌ Error creating test expense:', error);
    throw error;
  }
};

// Example usage:
// const group = await firebaseService.getGroupById('your-group-id');
// const testExpense = await createTestExpense('your-group-id', 'current-user-id', group.members);

export { createTestExpense };