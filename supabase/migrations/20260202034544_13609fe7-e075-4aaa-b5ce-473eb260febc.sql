-- Add UPDATE policy for study_group_members
-- Only group owners and admins can update member roles
-- This prevents privilege escalation by restricting who can modify roles
CREATE POLICY "Owners and admins can update member roles"
ON public.study_group_members
FOR UPDATE
USING (
  -- Current user must be owner or admin of this group
  EXISTS (
    SELECT 1 FROM study_group_members m
    WHERE m.group_id = study_group_members.group_id
    AND m.user_id = auth.uid()
    AND m.role IN ('owner', 'admin')
  )
  -- Cannot update your own membership (prevents self-promotion)
  AND study_group_members.user_id != auth.uid()
);