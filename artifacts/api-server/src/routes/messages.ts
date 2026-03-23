import { Router, type IRouter } from "express";
import { db, messagesTable, conversationsTable, conversationParticipantsTable, usersTable } from "@workspace/db";
import { ListMessagesResponse, SendMessageBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/messages", async (_req, res): Promise<void> => {
  const allConversations = await db.select().from(conversationsTable).orderBy(conversationsTable.updatedAt);
  const allParticipants = await db.select().from(conversationParticipantsTable);
  const allMessages = await db.select().from(messagesTable).orderBy(messagesTable.createdAt);
  const allUsers = await db.select().from(usersTable);

  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const participantMap = new Map<number, number[]>();
  for (const p of allParticipants) {
    if (!participantMap.has(p.conversationId)) participantMap.set(p.conversationId, []);
    participantMap.get(p.conversationId)!.push(p.userId);
  }

  const messagesByConversation = new Map<number, (typeof messagesTable.$inferSelect)[]>();
  for (const m of allMessages) {
    if (!messagesByConversation.has(m.conversationId)) messagesByConversation.set(m.conversationId, []);
    messagesByConversation.get(m.conversationId)!.push(m);
  }

  const conversations = allConversations.map((c) => {
    const participantIds = participantMap.get(c.id) ?? [];
    const participants = participantIds.map((uid) => userMap.get(uid)).filter(Boolean).map((u) => ({
      id: String(u!.id),
      name: u!.name,
      email: u!.email,
      role: u!.role as "admin" | "corporate" | "individual" | "driver",
      status: u!.status as "active" | "suspended" | "pending",
      createdAt: u!.createdAt,
    }));

    const msgs = messagesByConversation.get(c.id) ?? [];
    const lastMsg = msgs[msgs.length - 1];
    const unreadCount = msgs.filter((m) => !m.isRead).length;

    return {
      id: String(c.id),
      participants,
      lastMessage: lastMsg
        ? {
            id: String(lastMsg.id),
            conversationId: String(lastMsg.conversationId),
            senderId: String(lastMsg.senderId),
            body: lastMsg.body,
            createdAt: lastMsg.createdAt,
          }
        : undefined,
      unreadCount,
      updatedAt: c.updatedAt,
    };
  });

  res.json(ListMessagesResponse.parse({ conversations, total: conversations.length }));
});

router.post("/messages", async (req, res): Promise<void> => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let conversationId: number;

  if (parsed.data.conversationId) {
    conversationId = parseInt(parsed.data.conversationId, 10);
  } else {
    const [conv] = await db.insert(conversationsTable).values({}).returning();
    conversationId = conv.id;

    if (parsed.data.recipientId) {
      await db.insert(conversationParticipantsTable).values([
        { conversationId, userId: 1 },
        { conversationId, userId: parseInt(parsed.data.recipientId, 10) },
      ]);
    }
  }

  const [message] = await db
    .insert(messagesTable)
    .values({
      conversationId,
      senderId: 1,
      body: parsed.data.body,
    })
    .returning();

  await db
    .update(conversationsTable)
    .set({ updatedAt: new Date() });

  res.status(201).json({
    id: String(message.id),
    conversationId: String(message.conversationId),
    senderId: String(message.senderId),
    body: message.body,
    createdAt: message.createdAt,
  });
});

export default router;
