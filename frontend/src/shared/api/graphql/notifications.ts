import { graphql } from './graphql';

export const NotificationFragment = graphql(`
  fragment NotificationFields on Notification {
    id
    type
    isRead
    createdAt
    actor {
      id
      username
      displayName
      emoji
      avatarUrl
    }
    post {
      id
      content
    }
    comment {
      id
      content
    }
  }
`);

export const NotificationsQuery = graphql(`
  query Notifications($limit: Int, $offset: Int, $unreadOnly: Boolean) {
    notifications(limit: $limit, offset: $offset, unreadOnly: $unreadOnly) {
      id
      type
      isRead
      createdAt
      actor {
        id
        username
        displayName
        emoji
        avatarUrl
      }
      post {
        id
        content
      }
      comment {
        id
        content
      }
    }
  }
`);

export const UnreadNotificationsCountQuery = graphql(`
  query UnreadNotificationsCount {
    unreadNotificationsCount
  }
`);

export const MarkNotificationAsReadMutation = graphql(`
  mutation MarkNotificationAsRead($notificationId: ID, $postId: ID) {
    markNotificationAsRead(notificationId: $notificationId, postId: $postId)
  }
`);

export const MarkAllNotificationsAsReadMutation = graphql(`
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead
  }
`);

export const NOTIFICATION_FRAGMENT = NotificationFragment;
export const NOTIFICATIONS_QUERY = NotificationsQuery;
export const UNREAD_NOTIFICATIONS_COUNT_QUERY = UnreadNotificationsCountQuery;
export const MARK_NOTIFICATION_AS_READ_MUTATION = MarkNotificationAsReadMutation;
export const MARK_ALL_NOTIFICATIONS_AS_READ_MUTATION = MarkAllNotificationsAsReadMutation;
