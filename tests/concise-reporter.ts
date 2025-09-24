import type { Reporter, File, Task } from 'vitest/reporters'

export default class ConciseReporter implements Reporter {
  private errors: { file?: File; task: Task; error: unknown }[] = []

  onTaskUpdate(task: Task) {
    if (task.result?.state === 'fail') {
      this.errors.push({ file: task.file, task, error: task.result.error })
    }
  }

  onFinished() {
    if (this.errors.length) {
      console.log('\n\n=== Concise Test Failures ===')
      for (const { file, task, error } of this.errors) {
        console.log(
          `• ${file?.name ?? 'unknown file'} > ${task.name}\n  ${
            (error as Error)?.message || error
          }\n`
        )
      }
      console.log('=============================\n')
    }
  }
}


