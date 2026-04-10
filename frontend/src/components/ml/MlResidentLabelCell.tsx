type Props = {
  residentId: number;
  residentName: string | null | undefined;
};

/** Primary line: case control no. (API field residentName); secondary: numeric ID. */
export default function MlResidentLabelCell({ residentId, residentName }: Props) {
  const primary = residentName?.trim() || `Resident ${residentId}`;
  return (
    <td className="py-2 pr-4">
      <div className="font-medium text-foreground">{primary}</div>
      <div className="text-xs text-muted-foreground font-mono tabular-nums">ID {residentId}</div>
    </td>
  );
}
