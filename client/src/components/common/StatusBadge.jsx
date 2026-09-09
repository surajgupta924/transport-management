import { Badge } from '../ui/Badge'
import { formatLabel, statusTone } from '../../lib/status'

export function StatusBadge({ status }) {
  return <Badge tone={statusTone(status)}>{formatLabel(status)}</Badge>
}
