import Head from "next/head";
import { useState, useEffect } from "react";
import styles from "@/styles/Home.module.css";

interface Todo {
  id: number;
  title: string;
  completed: number; // 0: false, 1: true
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 新規作成モーダルの状態
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // トースト通知の状態
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // 編集モーダルの状態
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // タスク一覧を取得
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/todos');
      if (!response.ok) {
        throw new Error('タスクの取得に失敗しました');
      }
      const data = await response.json();
      setTodos(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // トースト表示の自動非表示
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 新規作成モーダルを開く
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    setCreateTitle('');
    setCreateError(null);
  };

  // 新規作成モーダルを閉じる
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateTitle('');
    setCreateError(null);
  };

  // タスクを作成
  const createTodo = async () => {
    if (!createTitle.trim()) {
      setCreateError('タイトルを入力してください');
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);
      
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: createTitle.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'タスクの作成に失敗しました');
      }

      // 成功時の処理
      setToast({ message: 'タスクを作成しました', type: 'success' });
      closeCreateModal();
      fetchTodos(); // 一覧を再取得
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsCreating(false);
    }
  };

  // 編集モーダルを開く
  const openEditModal = (todo: Todo) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  // 編集モーダルを閉じる
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTodo(null);
    setEditTitle('');
    setEditError(null);
  };

  // タスクを更新
  const updateTodo = async () => {
    if (!editingTodo || !editTitle.trim()) {
      setEditError('タイトルを入力してください');
      return;
    }

    try {
      setIsUpdating(true);
      setEditError(null);
      
      const response = await fetch(`/api/todos/${editingTodo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: editTitle.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'タスクの更新に失敗しました');
      }

      // 成功時の処理
      setToast({ message: 'タスクを更新しました', type: 'success' });
      closeEditModal();
      fetchTodos(); // 一覧を再取得
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsUpdating(false);
    }
  };

  // タスクの完了状態を切り替え
  const toggleTodoCompletion = async (todo: Todo) => {
    const newCompleted = todo.completed === 1 ? 0 : 1;
    
    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: newCompleted === 1 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'タスクの更新に失敗しました');
      }

      // 成功時は一覧を再取得
      fetchTodos();
    } catch (err) {
      // 失敗時はトーストでエラーを表示し、チェックボックスの状態は元に戻す
      setToast({ 
        message: err instanceof Error ? err.message : 'エラーが発生しました', 
        type: 'error' 
      });
    }
  };

  // タスクを削除
  const deleteTodo = async (todo: Todo) => {
    if (!confirm(`「${todo.title}」を削除しますか？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'タスクの削除に失敗しました');
      }

      // 成功時の処理
      setToast({ message: 'タスクを削除しました', type: 'success' });
      fetchTodos(); // 一覧を再取得
    } catch (err) {
      setToast({ 
        message: err instanceof Error ? err.message : 'エラーが発生しました', 
        type: 'error' 
      });
    }
  };

  return (
    <>
      <Head>
        <title>TODO アプリケーション</title>
        <meta name="description" content="TODO管理アプリケーション" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>TODO アプリケーション</h1>
          
          <div className={styles.header}>
            <button className={styles.createButton} onClick={openCreateModal}>
              新規作成
            </button>
          </div>

          {loading ? (
            <div className={styles.loading}>読み込み中...</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : todos.length === 0 ? (
            <div className={styles.empty}>タスクなし</div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>タイトル</th>
                    <th>完了</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {todos.map((todo) => (
                    <tr key={todo.id}>
                      <td>{todo.id}</td>
                      <td>{todo.title}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={todo.completed === 1}
                          onChange={() => toggleTodoCompletion(todo)}
                        />
                      </td>
                      <td>
                        <button 
                          className={styles.editButton}
                          onClick={() => openEditModal(todo)}
                        >
                          編集
                        </button>
                        <button 
                          className={styles.deleteButton}
                          onClick={() => deleteTodo(todo)}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 新規作成モーダル */}
          {isCreateModalOpen && (
            <div className={styles.modalOverlay}>
              <div className={styles.modal}>
                <h2 className={styles.modalTitle}>タスクを新規作成</h2>
                
                <div className={styles.formGroup}>
                  <label htmlFor="createTitle" className={styles.label}>
                    タイトル
                  </label>
                  <input
                    id="createTitle"
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    className={styles.input}
                    placeholder="タスクのタイトルを入力してください"
                    disabled={isCreating}
                  />
                </div>

                {createError && (
                  <div className={styles.errorMessage}>{createError}</div>
                )}

                <div className={styles.modalButtons}>
                  <button
                    className={styles.cancelButton}
                    onClick={closeCreateModal}
                    disabled={isCreating}
                  >
                    キャンセル
                  </button>
                  <button
                    className={styles.submitButton}
                    onClick={createTodo}
                    disabled={!createTitle.trim() || isCreating}
                  >
                    {isCreating ? '作成中...' : '作成'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 編集モーダル */}
          {isEditModalOpen && editingTodo && (
            <div className={styles.modalOverlay}>
              <div className={styles.modal}>
                <h2 className={styles.modalTitle}>タスクを編集</h2>
                
                <div className={styles.formGroup}>
                  <label htmlFor="editTitle" className={styles.label}>
                    タイトル
                  </label>
                  <input
                    id="editTitle"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={styles.input}
                    placeholder="タスクのタイトルを入力してください"
                    disabled={isUpdating}
                  />
                </div>

                {editError && (
                  <div className={styles.errorMessage}>{editError}</div>
                )}

                <div className={styles.modalButtons}>
                  <button
                    className={styles.cancelButton}
                    onClick={closeEditModal}
                    disabled={isUpdating}
                  >
                    キャンセル
                  </button>
                  <button
                    className={styles.submitButton}
                    onClick={updateTodo}
                    disabled={!editTitle.trim() || isUpdating}
                  >
                    {isUpdating ? '更新中...' : '更新'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* トースト通知 */}
          {toast && (
            <div className={`${styles.toast} ${styles[toast.type]}`}>
              {toast.message}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
