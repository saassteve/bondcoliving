import { supabase } from './supabase';

export interface AdminStatus {
  is_authenticated: boolean;
  current_auth_uid: string | null;
  has_admin_record: boolean;
  admin_user_id: string | null;
  admin_email: string | null;
  is_active: boolean;
  user_ids_match: boolean;
}

export interface PermissionCheckResult {
  hasPermission: boolean;
  warning: string | null;
  status: AdminStatus | null;
}

/**
 * Checks if the current user has valid admin permissions
 * Returns detailed status information and any warnings
 */
export async function checkAdminPermissions(): Promise<PermissionCheckResult> {
  try {
    const { data, error } = await supabase.rpc('check_admin_status');

    if (error) {
      console.error('Error checking admin status:', error);
      return {
        hasPermission: false,
        warning: 'Unable to verify admin permissions. Please refresh the page.',
        status: null,
      };
    }

    if (!data || data.length === 0) {
      return {
        hasPermission: false,
        warning: 'Unable to retrieve admin status.',
        status: null,
      };
    }

    const status = data[0] as AdminStatus;

    // Determine permission status and generate appropriate warnings
    if (!status.is_authenticated) {
      return {
        hasPermission: false,
        warning: 'You are not authenticated. Please log in again.',
        status,
      };
    }

    if (!status.has_admin_record) {
      return {
        hasPermission: false,
        warning: 'No admin record found for your account. Contact system administrator.',
        status,
      };
    }

    if (!status.is_active) {
      return {
        hasPermission: false,
        warning: 'Your admin account is inactive. Contact system administrator.',
        status,
      };
    }

    if (!status.user_ids_match) {
      return {
        hasPermission: false,
        warning: 'Admin account configuration issue detected. Please log out and log back in.',
        status,
      };
    }

    // All checks passed
    return {
      hasPermission: true,
      warning: null,
      status,
    };
  } catch (err) {
    console.error('Failed to check admin permissions:', err);
    return {
      hasPermission: false,
      warning: 'An error occurred while checking permissions.',
      status: null,
    };
  }
}

/**
 * Validates that a deletion operation actually deleted rows
 * Returns true if successful, false if blocked by RLS
 */
export function validateDeletionResult(result: { data: any[] | null; error: any }): {
  success: boolean;
  rowsAffected: number;
  error: string | null;
} {
  if (result.error) {
    return {
      success: false,
      rowsAffected: 0,
      error: result.error.message,
    };
  }

  const rowsAffected = result.data?.length || 0;

  if (rowsAffected === 0) {
    return {
      success: false,
      rowsAffected: 0,
      error: 'Permission denied: RLS policy blocked the operation. Your admin account may need to be reconfigured.',
    };
  }

  return {
    success: true,
    rowsAffected,
    error: null,
  };
}

/**
 * Logs a deletion attempt to the audit log
 */
export async function logDeletionAttempt(params: {
  targetTable: string;
  targetId: string;
  targetIdentifier: string;
  success: boolean;
  rowsAffected: number;
  errorMessage?: string;
}): Promise<void> {
  try {
    await supabase.from('deletion_audit_log').insert({
      target_table: params.targetTable,
      target_id: params.targetId,
      target_identifier: params.targetIdentifier,
      success: params.success,
      rows_affected: params.rowsAffected,
      error_message: params.errorMessage || null,
    });
  } catch (err) {
    console.error('Failed to log deletion attempt:', err);
  }
}

/**
 * Performs a safe deletion with automatic row count validation and audit logging
 */
export async function safeDelete(params: {
  table: string;
  id: string;
  identifier: string;
}): Promise<{
  success: boolean;
  rowsAffected: number;
  error: string | null;
}> {
  try {
    // Perform deletion with .select() to get affected rows
    const result = await supabase
      .from(params.table)
      .delete()
      .eq('id', params.id)
      .select();

    // Validate the result
    const validation = validateDeletionResult(result);

    // Log the attempt
    await logDeletionAttempt({
      targetTable: params.table,
      targetId: params.id,
      targetIdentifier: params.identifier,
      success: validation.success,
      rowsAffected: validation.rowsAffected,
      errorMessage: validation.error || undefined,
    });

    return validation;
  } catch (err: any) {
    console.error('Unexpected error during deletion:', err);

    // Log the failed attempt
    await logDeletionAttempt({
      targetTable: params.table,
      targetId: params.id,
      targetIdentifier: params.identifier,
      success: false,
      rowsAffected: 0,
      errorMessage: err.message || 'Unexpected error',
    });

    return {
      success: false,
      rowsAffected: 0,
      error: 'An unexpected error occurred during deletion.',
    };
  }
}

/**
 * Refreshes the admin session if needed
 */
export async function refreshAdminSession(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('Failed to refresh session:', error);
      return false;
    }

    return data.session !== null;
  } catch (err) {
    console.error('Error refreshing session:', err);
    return false;
  }
}
