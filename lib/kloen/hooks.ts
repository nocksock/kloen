export const useSignal = <T extends any>(s: T) => {
  const [value, setValue] = useState<T>(s.get())
  useEffect(() => s.onChange(setValue), [])
  return [value, setValue]
}
