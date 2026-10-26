import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type ConfirmRequest = {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

export function ConfirmAlertDialog({
  request,
  onOpenChange,
}: {
  request: ConfirmRequest | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <AlertDialog open={request != null} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{request?.title}</AlertDialogTitle>
          <AlertDialogDescription>{request?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              request?.onConfirm();
              onOpenChange(false);
            }}
          >
            {request?.confirmLabel ?? 'Confirm'}
          </AlertDialogAction>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
